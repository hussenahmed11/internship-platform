import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  role: "student" | "company" | "advisor" | "coordinator" | "admin";
  department_id?: string;
  phone?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Create client with user's token to verify they're admin
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    // Get the requesting user
    const { data: { user: requestingUser }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is admin using user_roles table
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      // Also check profiles table as fallback
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("user_id", requestingUser.id)
        .single();

      if (profileError || profileData?.role !== "admin") {
        return new Response(
          JSON.stringify({ error: "Only admins can create users" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Parse request body
    const body: CreateUserRequest = await req.json();
    const { email, password, full_name, role, department_id, phone } = body;

    // Validate required fields
    if (!email || !password || !full_name || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, password, full_name, role" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate role
    const validRoles = ["student", "company", "advisor", "coordinator", "admin"];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
        role,
      },
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUser = authData.user;

    // Upsert profile because auth trigger may have pre-created it
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          user_id: newUser.id,
          email,
          full_name,
          role,
          department_id: department_id || null,
          phone: phone || null,
          onboarding_completed: false,
        },
        {
          onConflict: "user_id",
          ignoreDuplicates: false,
        }
      )
      .select("id")
      .single();

    if (profileError || !profileData) {
      // Rollback: delete the auth user if profile upsert fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.id);
      return new Response(
        JSON.stringify({ error: `Failed to create profile: ${profileError?.message || "Unknown profile error"}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure role mapping exists
    const { error: userRoleError } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        {
          user_id: newUser.id,
          role,
        },
        {
          onConflict: "user_id,role",
          ignoreDuplicates: true,
        }
      );

    if (userRoleError) {
      console.error("Warning: Failed to add user role:", userRoleError.message);
      // Don't rollback for this, profile is source of truth
    }

    // Create role-specific records idempotently
    if (role === "student") {
      await supabaseAdmin.from("students").upsert(
        {
          profile_id: profileData.id,
          student_id: `STU${Date.now().toString().slice(-8)}`,
        },
        {
          onConflict: "profile_id",
          ignoreDuplicates: true,
        }
      );
    } else if (role === "company") {
      await supabaseAdmin.from("companies").upsert(
        {
          profile_id: profileData.id,
          company_name: full_name,
          verified: false,
        },
        {
          onConflict: "profile_id",
          ignoreDuplicates: true,
        }
      );
    } else if (role === "advisor" || role === "coordinator") {
      await supabaseAdmin.from("faculty").upsert(
        {
          profile_id: profileData.id,
          title: role === "coordinator" ? "Department Coordinator" : "Academic Advisor",
        },
        {
          onConflict: "profile_id",
          ignoreDuplicates: true,
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          role: role,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
