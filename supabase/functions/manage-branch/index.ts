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
    if (action === "create-branch") {
      const name = typeof payload.name === "string" ? payload.name.trim() : "";
      if (!name || name.length > 80) {
        return response(request, 400, { error: "Branch names must contain 1 to 80 characters." });
      }

      const { data, error } = await callerClient.rpc("create_map_branch", {
        branch_name: name,
      });
      if (error) throw error;
      const branch = Array.isArray(data) ? data[0] : data;
      if (!branch) throw new Error("Supabase did not return the newly created branch.");
      return response(request, 200, { branch });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (action === "set-branch-account") {
      const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
      const password = typeof payload.password === "string" ? payload.password : "";
      const branchIds = Array.isArray(payload.branchIds)
        ? [...new Set(payload.branchIds.filter((id: unknown): id is string => typeof id === "string"))]
        : [];
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        return response(request, 400, { error: "Enter a valid email address." });
      }
      if (password.length < 10 || password.length > 128) {
        return response(request, 400, { error: "Passwords must contain 10 to 128 characters." });
      }
      if (!branchIds.length || branchIds.some((id: string) => !/^branch-[a-z0-9-]{1,60}$/.test(id))) {
        return response(request, 400, { error: "Choose at least one valid branch." });
      }

      const { data: selectedBranches, error: selectedBranchesError } = await adminClient
        .from("map_branches")
        .select("id")
        .in("id", branchIds);
      if (selectedBranchesError) throw selectedBranchesError;
      if (selectedBranches.length !== branchIds.length) {
        return response(request, 400, { error: "One or more selected branches do not exist." });
      }

      let existingUser: { id: string; email?: string } | null = null;
      for (let page = 1; ; page += 1) {
        const { data, error } = await adminClient.auth.admin.listUsers({
          page,
          perPage: 1000,
        });
        if (error) throw error;
        existingUser = data.users.find((user) => user.email?.toLowerCase() === email) || null;
        if (existingUser || data.users.length < 1000) break;
      }

      let userId: string;
      let createdUser = false;
      if (existingUser) {
        const { data: adminAssignment, error: adminAssignmentError } = await adminClient
          .from("map_admins")
          .select("user_id")
          .eq("user_id", existingUser.id)
          .maybeSingle();
        if (adminAssignmentError) throw adminAssignmentError;
        if (adminAssignment) {
          return response(request, 400, { error: "A main administrator account cannot be used as a branch viewer." });
        }

        const { error } = await adminClient.auth.admin.updateUserById(existingUser.id, {
          email,
          password,
          email_confirm: true,
        });
        if (error) throw error;
        userId = existingUser.id;
      } else {
        const { data: created, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        if (createError) throw createError;
        if (!created.user) throw new Error("Supabase did not return the newly created user.");
        userId = created.user.id;
        createdUser = true;
      }

      const { error: accessError } = await callerClient.rpc("set_map_branch_access", {
        target_user_id: userId,
        target_branch_ids: branchIds,
      });
      if (accessError) {
        if (createdUser) {
          const { error: rollbackError } = await adminClient.auth.admin.deleteUser(userId);
          if (rollbackError) {
            console.error("Could not remove a viewer account after branch assignment failed.", rollbackError);
            throw new Error(
              "The account was created but could not be assigned or removed. Contact the project administrator.",
            );
          }
        }
        throw accessError;
      }

      return response(request, 200, { branchIds, email });
    }

    if (!/^branch-[a-z0-9-]{1,60}$/.test(branchId)) {
      return response(request, 400, { error: "Choose a valid configured branch." });
    }

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

    if (action === "delete-branch") {
      const { data, error } = await callerClient.rpc("delete_map_branch", {
        target_branch_id: branchId,
      });
      if (error) throw error;
      const deleted = Array.isArray(data) ? data[0] : data;
      if (!deleted) throw new Error("Supabase did not return the deleted branch.");
      return response(request, 200, { branch: deleted });
    }

    return response(request, 400, { error: "Unsupported branch management action." });
  } catch (error) {
    console.error("Branch management request failed:", error);
    const message = error instanceof Error ? error.message : "The request could not be completed.";
    return response(request, 500, { error: message });
  }
});
