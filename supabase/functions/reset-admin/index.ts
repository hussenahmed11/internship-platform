import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body = await req.json();
    const { bootstrap_key, email, password } = body;

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

    const userEmail = email || "admin@haramayauniversity.edu.et";
    const userPassword = password || "Admin123!@#";

    // List users to find admin
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      return new Response(
        JSON.stringify({ error: `Failed to list users: ${listError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const existingUser = users?.users?.find(u => u.email === userEmail);
    
    if (existingUser) {
      // Update password for existing user
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password: userPassword,
        email_confirm: true,
      });

      if (updateError) {
        return new Response(
          JSON.stringify({ error: `Failed to update password: ${updateError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Admin password reset successfully",
          user: {
            id: existingUser.id,
            email: existingUser.email,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // User doesn't exist in auth, create them
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userEmail,
        password: userPassword,
        email_confirm: true,
        user_metadata: { full_name: "System Administrator" },
      });

      if (authError) {
        return new Response(
          JSON.stringify({ error: `Failed to create user: ${authError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update profile with new user_id
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ user_id: authData.user.id })
        .eq("email", userEmail);

      if (profileError) {
        console.error("Profile update error:", profileError);
      }

      // Add to user_roles table if not exists
      await supabaseAdmin.from("user_roles").upsert({
        user_id: authData.user.id,
        role: "admin",
      }, { onConflict: "user_id" });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Admin user created and linked successfully",
          user: {
            id: authData.user.id,
            email: authData.user.email,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error resetting admin:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
