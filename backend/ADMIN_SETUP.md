# Initial Admin Setup

The API supports two ways to create an admin user:

1. Admin signup endpoint (protected by `ADMIN_SECRET`):

   - POST `/api/auth/admin/signup`
   - Body: `{ email, password, fullName, adminSecret }`
   - Server checks `adminSecret` against `ADMIN_SECRET` env var (defaults to `dev-admin-secret`)

2. Initial admin creation via login (convenience for first admin):

   - POST `/api/auth/login`
   - Body: `{ email, password, fullName, adminSecret }`
   - If no admin users exist, providing the correct `adminSecret` and `fullName` will create the first admin account and return a JWT.

Environment:

- Set `ADMIN_SECRET` in your environment or `.env` for production. The default is `dev-admin-secret` (change this!).

Frontend:

- The frontend includes a public Admin Setup page at `/admin/setup` which posts to the login endpoint with `adminSecret` to create the first admin if none exist.

Security note:

- Protect `ADMIN_SECRET` and rotate/change it after creating initial admin in production.
- Remove or restrict public setup endpoints behind deployment access controls if desired.
