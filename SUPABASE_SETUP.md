# Supabase setup

The map has 25 isolated branches. Each branch has its own region-name list and GeoJSON boundaries. The main administrator can see and edit every branch, rename branches, and create or reset one login account per branch. A branch account can only read and edit its assigned branch.

## Initial setup or upgrade

1. In Supabase SQL Editor, run `supabase-schema.sql`. The migration creates branches 1–25, branch memberships, per-branch map storage, row-level security policies, and Realtime publication. Existing shared map data is copied to branch 4; the old shared table is then made inaccessible to browser users. The migration keeps that old row intact as a backup.
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

For an existing deployment, run the updated SQL migration once, deploy the Edge Function, and redeploy the site. The initial `branch-04` import uses `ON CONFLICT DO NOTHING`, so re-running the migration will not overwrite branch data.

## Create branch logins and draw region boundaries

1. Sign in with the main administrator account. Select one of the 25 branches; the initial names are `لق ١` through `لق ٢٥` and can be renamed in the branch panel.
2. In the branch panel, save a unique email and a password of at least 10 characters. Repeating this action for that branch resets its existing credentials. Share the login details privately with that branch's operator.
3. Add each region name to the region combo, select the name, and draw its polygon. Names and boundaries are saved only in the selected branch. Existing map data is assigned to branch 4.
4. Give each branch operator only that branch's credentials. They can draw and edit their branch's regions, but cannot select or query other branches. The main administrator retains access to all 25 branches.

Branch accounts are created as confirmed Supabase Auth users by the Edge Function. It verifies the caller's session and main-admin role before using the server-only service key. Email/password values are sent over HTTPS and are not stored in the app or map database.

## Local-data migration

If existing map data is only in this browser's IndexedDB and not in the old cloud `map_state`, sign in as the main administrator, select branch 4, and use the migration button. Do not clear browser data until the migration finishes and branch 4's map is verified.

## Confirmation emails

Branch accounts created by the main administrator are confirmed by the Edge Function. For manually created main-admin accounts, an administrator can confirm the user in Authentication > Users. For regular email delivery, configure a trusted custom SMTP provider in Authentication > SMTP Settings.
