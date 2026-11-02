import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://pdkmap.onrender.com",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);

function response(
  request: Request,
  status: number,
  body: Record<string, unknown>,
) {
  const origin = request.headers.get("origin") || "";
  const headers = new Headers({
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  });
  if (!origin || allowedOrigins.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin || "*");
  }
  return new Response(status === 204 ? null : JSON.stringify(body), { status, headers });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return response(request, 204, {});
  if (request.method !== "POST") {
    return response(request, 405, { error: "Only POST requests are supported." });
  }

  const origin = request.headers.get("origin") || "";
  if (origin && !allowedOrigins.has(origin)) {
    return response(request, 403, { error: "This site is not allowed to manage branches." });
  }

  const authorization = request.headers.get("authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!authorization || !supabaseUrl || !anonKey || !serviceRoleKey) {
    return response(request, 500, { error: "Branch management is not configured." });
  }

  try {
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const token = authorization.replace(/^Bearer\s+/i, "");
    const { data: userResult, error: userError } = await callerClient.auth.getUser(token);
    if (userError || !userResult.user) {
      return response(request, 401, { error: "A valid signed-in account is required." });
    }

    const { data: isAdmin, error: roleError } = await callerClient.rpc("is_map_admin");
    if (roleError) throw roleError;
    if (isAdmin !== true) {
      return response(request, 403, { error: "Only the main map administrator can manage branches." });
    }

    const payload = await request.json();
    const action = typeof payload.action === "string" ? payload.action : "";
    const branchId = typeof payload.branchId === "string" ? payload.branchId : "";
    if (!/^branch-(0[1-9]|1[0-9]|2[0-5])$/.test(branchId)) {
      return response(request, 400, { error: "Choose one of the 25 configured branches." });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: branch, error: branchError } = await adminClient
      .from("map_branches")
      .select("id")
      .eq("id", branchId)
      .maybeSingle();
    if (branchError) throw branchError;
    if (!branch) return response(request, 404, { error: "The selected branch does not exist." });

    if (action === "rename-branch") {
      const name = typeof payload.name === "string" ? payload.name.trim() : "";
      if (!name || name.length > 80) {
        return response(request, 400, { error: "Branch names must contain 1 to 80 characters." });
      }
      const { data, error } = await adminClient
        .from("map_branches")
        .update({ name })
        .eq("id", branchId)
        .select("id, name")
        .single();
      if (error) throw error;
      return response(request, 200, { branch: data });
    }

    if (action === "set-branch-account") {
      const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
      const password = typeof payload.password === "string" ? payload.password : "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        return response(request, 400, { error: "Enter a valid email address." });
      }
      if (password.length < 10 || password.length > 128) {
        return response(request, 400, { error: "Passwords must contain 10 to 128 characters." });
      }

      const { data: assignment, error: assignmentError } = await adminClient
        .from("map_branch_users")
        .select("user_id")
        .eq("branch_id", branchId)
        .maybeSingle();
      if (assignmentError) throw assignmentError;

      if (assignment) {
        const { error } = await adminClient.auth.admin.updateUserById(assignment.user_id, {
          email,
          password,
          email_confirm: true,
        });
        if (error) throw error;
      } else {
        const { data: created, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        if (createError) throw createError;
        if (!created.user) throw new Error("Supabase did not return the newly created user.");

        const { error: assignmentCreateError } = await adminClient
          .from("map_branch_users")
          .insert({ user_id: created.user.id, branch_id: branchId });
        if (assignmentCreateError) {
          const { error: rollbackError } = await adminClient.auth.admin.deleteUser(created.user.id);
          if (rollbackError) {
            console.error("Could not remove an unassigned account after provisioning failed.", rollbackError);
            throw new Error(
              "The account was created but could not be assigned or removed. Contact the project administrator.",
            );
          }
          throw assignmentCreateError;
        }
      }

      return response(request, 200, { branchId, email });
    }

    return response(request, 400, { error: "Unsupported branch management action." });
  } catch (error) {
    console.error("Branch management request failed:", error);
    const message = error instanceof Error ? error.message : "The request could not be completed.";
    return response(request, 500, { error: message });
  }
});
