import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncResult {
  success: boolean;
  syncedCount: number;
  errors: string[];
  syncedUsers: { email: string; role: string }[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase admin client with service role key
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

    // Verify requesting user is admin
    const { data: { user: requestingUser }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .single();

    if (profileError || profileData?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Only admins can sync users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all auth users
    const { data: authUsersData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) {
      return new Response(
        JSON.stringify({ error: `Failed to list auth users: ${authError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authUsers = authUsersData.users;

    // Get all existing profiles
    const { data: existingProfiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("user_id");

    if (profilesError) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch profiles: ${profilesError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const existingUserIds = new Set(existingProfiles?.map((p) => p.user_id) || []);

    // Find users without profiles
    const usersToSync = authUsers.filter((user) => !existingUserIds.has(user.id));

    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      errors: [],
      syncedUsers: [],
    };

    // Sync each user
    for (const user of usersToSync) {
      try {
        const role = (user.user_metadata?.role as string) || "student";
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "";

        // Create profile
        const { data: newProfile, error: insertError } = await supabaseAdmin
          .from("profiles")
          .insert({
            user_id: user.id,
            email: user.email!,
            full_name: fullName,
            role: role as "student" | "company" | "advisor" | "coordinator" | "admin",
            onboarding_completed: false,
          })
          .select("id")
          .single();

        if (insertError) {
          result.errors.push(`Failed to create profile for ${user.email}: ${insertError.message}`);
          continue;
        }

        // Create user_roles entry
        await supabaseAdmin.from("user_roles").upsert(
          { user_id: user.id, role },
          { onConflict: "user_id,role", ignoreDuplicates: true }
        );

        // Create role-specific records
        if (role === "student" && newProfile) {
          await supabaseAdmin.from("students").upsert(
            {
              profile_id: newProfile.id,
              student_id: `STU-${user.id.substring(0, 8)}`,
            },
            { onConflict: "profile_id", ignoreDuplicates: true }
          );
        } else if (role === "company" && newProfile) {
          await supabaseAdmin.from("companies").upsert(
            {
              profile_id: newProfile.id,
              company_name: fullName || "Company",
              verified: false,
            },
            { onConflict: "profile_id", ignoreDuplicates: true }
          );
        } else if ((role === "advisor" || role === "coordinator") && newProfile) {
          await supabaseAdmin.from("faculty").upsert(
            {
              profile_id: newProfile.id,
              title: role === "coordinator" ? "Department Coordinator" : "Academic Advisor",
            },
            { onConflict: "profile_id", ignoreDuplicates: true }
          );
        }

        result.syncedCount++;
        result.syncedUsers.push({ email: user.email!, role });
      } catch (err) {
        result.errors.push(`Error syncing ${user.email}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: result.errors.length === 0,
        syncedCount: result.syncedCount,
        totalAuthUsers: authUsers.length,
        totalProfiles: existingProfiles?.length || 0,
        syncedUsers: result.syncedUsers,
        errors: result.errors,
        message: `Successfully synced ${result.syncedCount} users. ${result.errors.length > 0 ? `${result.errors.length} errors occurred.` : ""}`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in sync-users function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
