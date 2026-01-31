import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body = await req.json();
    const { bootstrap_key, email, password, full_name } = body;

    // Validate bootstrap key (simple security measure)
    const expectedKey = Deno.env.get("BOOTSTRAP_KEY") || "haramaya-admin-bootstrap-2024";
    if (bootstrap_key !== expectedKey) {
      return new Response(
        JSON.stringify({ error: "Invalid bootstrap key" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if admin already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1);

    if (existingAdmin && existingAdmin.length > 0) {
      return new Response(
        JSON.stringify({ error: "Admin user already exists" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to create admin user in Supabase Auth
    let newUser;
    const userEmail = email || "admin@haramayauniversity.edu.et";
    const userPassword = password || "Admin123!@#";
    const userName = full_name || "System Administrator";

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true,
      user_metadata: { full_name: userName },
    });

    if (authError) {
      // If user exists, try to get them and update password
      if (authError.message.includes("already been registered")) {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users?.users?.find(u => u.email === userEmail);
        
        if (existingUser) {
          // Update password for existing user
          await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
            password: userPassword,
            email_confirm: true,
          });
          newUser = existingUser;
        } else {
          return new Response(
            JSON.stringify({ error: authError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      newUser = authData.user;
    }

    

    // Create profile record
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: newUser.id,
        email: newUser.email,
        full_name: full_name || "System Administrator",
        role: "admin",
        onboarding_completed: true,
      });

    if (profileError) {
      // Rollback: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.id);
      return new Response(
        JSON.stringify({ error: `Failed to create profile: ${profileError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add to user_roles table
    await supabaseAdmin.from("user_roles").insert({
      user_id: newUser.id,
      role: "admin",
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin user created successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          role: "admin",
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error bootstrapping admin:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
