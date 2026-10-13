# Supabase setup

Every user must sign in before the map is visible. Authenticated viewers can read the shared map; only users listed in `map_admins` can edit it.

1. Create a Supabase project and run `supabase-schema.sql` in the SQL Editor.
2. In Authentication, create accounts for viewers and admins. Keep public sign-up disabled; create accounts yourself and give each user their credentials through a private channel.
3. Add each admin account to `map_admins` from the SQL Editor, replacing the email:

```sql
insert into public.map_admins (user_id)
select id from auth.users where email = 'admin@example.com'
on conflict (user_id) do nothing;
```

4. Copy the project URL and public `anon` key from Project Settings > API into `supabase-config.js`. Never put a `service_role` key in browser code.
5. In Authentication > URL Configuration, set the deployed site's URL and add its local development URL to the redirect allow list.
6. Deploy `index.html`, `main.js`, `style.css`, and `supabase-config.js` to an HTTPS static host.

All users sign in with the accounts created in step 2. Supabase Row Level Security blocks unauthenticated reads, gives authenticated users read-only access, and allows writes only to admins. On the first admin sign-in, if the cloud map is empty and this browser has existing IndexedDB map data, the app offers to upload that data. Do not clear the old browser data until the migration finishes and the shared map is verified.
