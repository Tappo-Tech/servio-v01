

## Environment and email verification

After cloning, install dependencies and create the local environment file:

```bash
npm ci
Copy-Item .env.example .env # PowerShell
# macOS/Linux: cp .env.example .env
# Edit .env and set REACT_APP_SUPABASE_KEY to the public anon/publishable key
npm start
```

Never commit `.env` or any Supabase service-role key. Only the public anon/publishable key belongs in the browser app.

Manager registration uses `supabase.auth.signUp` with a redirect to `/login`. When **Confirm email** is enabled in Supabase Auth, TAPPO shows a verification screen and supports resending the activation email. The manager must confirm the email before login succeeds.

In Supabase Dashboard configure:

- Authentication → Providers → Email → **Confirm email** enabled.
- Authentication → URL Configuration → Site URL and Redirect URLs containing the local and production app URLs.

Useful scripts:

```bash
npm start
npm run build
npm test
```
