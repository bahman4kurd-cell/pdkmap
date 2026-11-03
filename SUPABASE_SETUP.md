# Supabase setup

The map supports a growing number of isolated branches. Each branch has its own region-name list and GeoJSON boundaries. The main administrator can create, rename, and delete branches; draw, edit, and delete their regions; and create or reset read-only viewer accounts. Each viewer can be assigned one or more branches and can only view the branches explicitly selected for that account.

## Initial setup or upgrade

1. In Supabase SQL Editor, run `supabase-schema.sql`. The migration creates initial branches 1–25, branch memberships, per-branch map storage, admin-only write policies, and Realtime publication. Existing shared map data is copied to branch 4; the old shared table is then made inaccessible to browser users. The migration keeps that old row intact as a backup.
2. Create the main administrator account under Authentication > Users. Public sign-up should remain disabled. Add that account to `map_admins`:

   ```sql
   insert into public.map_admins (user_id)
   select id from auth.users where email = 'admin@example.com'
   on conflict (user_id) do nothing;
   ```

3. Configure `supabase-config.js` with the project URL and public anon/publishable key. Never put a `service_role` key in browser code.
4. Deploy the branch-management Edge Function from the repository root:

   ```sh
   supabase login
   supabase link --project-ref xauuquctqpiixloxfzzp
   supabase functions deploy manage-branch
   ```

   Supabase supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to hosted Edge Functions. If the project uses custom function secrets, configure those values in Supabase's secret manager; never commit them.
5. In Authentication > URL Configuration, set the deployed site's URL and add local development URLs to the redirect allow list.
6. Deploy `index.html`, `main.js`, `style.css`, `supabase-config.js`, and the `supabase/` function/config files to the appropriate hosts. The function itself must be deployed to Supabase, not served as a static file by Render.

For an existing deployment, run `supabase-migration-multi-branch-access.sql` in the Supabase SQL Editor, deploy the Edge Function, and redeploy the site. This migration changes branch memberships to many-to-many and adds protected RPCs for assigning viewer access and deleting branches. It is safe to re-run. The initial `branch-04` import uses `ON CONFLICT DO NOTHING`, so re-running the full schema will not overwrite branch data. The schema removes the former 25-branch limit and keeps map writes main-admin-only.

## Create branch logins and draw region boundaries

1. Sign in with the main administrator account. Open **بەڕێوەبردنی لقەکان** and create a branch with its own name. The initial branches `لق ١` through `لق ٢٥` are available and can be renamed there; new branches can be added whenever needed.
2. To create a viewer account, enter its email and a password of at least 10 characters, then check every branch it may view. The account's branch choices replace any previous assignments when credentials are reset. The confirmation lists the selected branches. Share the login details privately.
3. Select a branch in the map selector. Add region names and draw, edit, or delete boundaries with the map tools. Names and boundaries are saved only in the selected branch. A viewer assigned to multiple branches can switch among those branches, but remains read-only. The map opens to the whole of Iraq; existing map data is assigned to branch 4.
4. The main administrator can rename branches and delete an entire branch and its map data from the branch-management panel. Deletion is confirmed, cannot remove the final remaining branch, and removes that branch's viewer assignments. Auth accounts with no remaining branch assignments are left in Supabase but cannot access map data. Row-level security enforces viewer access and read-only permissions in the database.

Branch accounts are created as confirmed Supabase Auth users by the Edge Function. It verifies the caller's session and main-admin role before using the server-only service key. Email/password values are sent over HTTPS and are not stored in the app or map database.

## Local-data migration

If existing map data is only in this browser's IndexedDB and not in the old cloud `map_state`, sign in as the main administrator, select branch 4, and use the migration button. Do not clear browser data until the migration finishes and branch 4's map is verified.

## Confirmation emails

Branch accounts created by the main administrator are confirmed by the Edge Function. For manually created main-admin accounts, an administrator can confirm the user in Authentication > Users. For regular email delivery, configure a trusted custom SMTP provider in Authentication > SMTP Settings.
