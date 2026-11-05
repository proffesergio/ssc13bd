# SSC13BD Credential and Deployment Guide

## 1. Know what is already deployed

- Website: **https://ssc13bd.vercel.app**.
- Backend: **https://ssc13bd.vercel.app/api/**, packaged from `backend/` through Next.js API wrappers. Both workspaces share one Vercel deployment; no second server or backend URL is needed.
- Vercel: **newellx / ssc13bd**, root directory `frontend`, Node.js **22.x**, with source outside the root included.
- GitHub: **proffesergio/ssc13bd**, production branch **main**, connected to Vercel.
- Neon: **ssc13bd**, project ID `snowy-wave-11548239`, Singapore region, database `ssc13bd`. The initial migration is applied.

Production already has `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET`. Preserve those values. Login configuration is deferred: visitors can browse; account-only actions remain protected. Adding Google placeholders does not enable sign-in yet.

## 2. Put each credential in the correct place

Create password-manager entries for `SSC13BD / Production`, `Preview`, and `Development`. Record each service owner, project, variable name, purpose, value, and rotation date. Invite maintainers through service team settings rather than sharing account passwords.

| Location | Purpose | Commit? |
| --- | --- | --- |
| `frontend/.env.local` | Next.js local runtime; edit this for local app settings | No |
| Root `.env.local` | Operator reference plus CLI-managed values; the app in `frontend/` does not load it | No |
| `backend/.env` | Prisma migrations and moderator-seed CLI settings | No |
| `frontend/.env.example`, `backend/.env.example` | Blank, shareable templates | Yes |
| Vercel project → Settings → Environment Variables | Hosted runtime configuration | Stored by Vercel |

Local application placeholders have been added without replacing existing values. `VERCEL_OIDC_TOKEN`, if present in root `.env.local`, is CLI-managed; it is not an application session secret or a Google credential. Do not copy it into the frontend or production environment manually.

## 3. Configure local development

1. Open [Neon Console](https://console.neon.tech), select the existing **ssc13bd** project, and create/select a **development branch**. Keep local development separate from production data.
2. Open **Connect** and select the intended branch, database, and role. Copy the **pooled** URL into `DATABASE_URL` in `frontend/.env.local` and `backend/.env`. Its hostname contains `-pooler`.
3. Keep `sslmode=require`. Append `&connection_limit=1&pool_timeout=10` to the pooled URL if missing. Copy connection strings exactly; URL-encode reserved password characters if constructing one manually.
4. Turn pooling off in Connect and copy the corresponding **direct** URL into `DIRECT_URL` in both files. Both URLs must use the same branch/database/role. See [Neon's connection guide](https://neon.com/docs/connect/connect-from-any-app).
5. Keep `NEXTAUTH_URL="http://localhost:3000"` in `frontend/.env.local`. Run `openssl rand -base64 32` and paste its output into `NEXTAUTH_SECRET` there. Use a different secret from production.
6. Leave Google, SMTP, Facebook, and `MODERATOR_EMAILS` blank for now. Restart the development server after changing runtime values.
7. From the repository root, run:

```sh
npm ci
npm run db:generate
npm run db:deploy -w backend
npm run dev
```

Prisma reads `backend/.env`; Next.js reads `frontend/.env.local`. The root reference file supplies neither automatically. With blank database URLs, local browsing uses the labeled read-only sample preview. Leave unused credentials empty rather than filling them with invalid text such as `YOUR_PASSWORD`.

## 4. Manage production and preview settings

1. Open [SSC13BD environment settings](https://vercel.com/newellx/ssc13bd/settings/environment-variables).
2. Confirm the existing **Production** variables below. Never replace their working values with the blank template.

| Variable | Production value/source |
| --- | --- |
| `DATABASE_URL` | Existing pooled Neon production URL |
| `DIRECT_URL` | Existing direct Neon production URL |
| `NEXTAUTH_URL` | `https://ssc13bd.vercel.app` |
| `NEXTAUTH_SECRET` | Existing generated secret; keep stable across releases |

3. Configure **Development** and **Preview** separately with non-production Neon branches. For authenticated previews later, use a stable staging URL with its own OAuth client/callback.
4. Leave optional providers absent or empty. Database URLs, session secrets, and OAuth secrets must never use the `NEXT_PUBLIC_` prefix.
5. Save changes and redeploy. Environment changes apply to subsequent deployments, not the running release. See [Vercel environment variables](https://vercel.com/docs/environment-variables).

Normal Git deployments use Vercel's GitHub integration. No personal `VERCEL_TOKEN`, GitHub personal access token, or Neon API key is needed inside `.env.local` for application operation.

## 5. Prepare Google sign-in for the next iteration

**The current code does not consume `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET`.** Provider integration, sign-in UI, and account/role tests will be implemented together next iteration. These steps prepare credentials only.

1. In [Google Cloud Console](https://console.cloud.google.com), create/select an **SSC13BD** project. Open **Google Auth Platform** and configure Branding, Audience, and support/contact details. Choose an external audience for the wider community; add designated test accounts while the app is in testing.
2. Under **Clients**, create an OAuth client of type **Web application**. Prefer separate development and production clients. Request only basic identity scopes: `openid`, `email`, and `profile`.
3. For production, use origin `https://ssc13bd.vercel.app` and reserve callback `https://ssc13bd.vercel.app/api/auth/callback/google`.
4. For development, use origin `http://localhost:3000` and reserve callback `http://localhost:3000/api/auth/callback/google`. Origins have no path; callback paths must match exactly. These are the planned NextAuth Google-provider URLs. See [Google's web-server OAuth instructions](https://developers.google.com/identity/protocols/oauth2/web-server).
5. Store the client ID/secret in the matching password-manager entry. Put the development pair in `frontend/.env.local`. When integrating the provider, add the production pair to Vercel's **Production** environment as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
6. Use **one Google sign-in flow for members and admins**. Server-side database roles determine permissions. A Google identity does not establish SSC batch membership; preserve the moderator approval gate.
7. After Google integration, sign in with the intended moderator account first. Set its exact verified email in `MODERATOR_EMAILS` in the intended database's `backend/.env`, then deliberately run `npm run db:seed`. The current seed grants `MODERATOR`, not `ADMIN`, and does not approve batch membership. It can create missing accounts, so defer it until after first sign-in to avoid OAuth account-linking conflicts. Full administrator provisioning will be handled explicitly in the Google-login iteration.

## 6. Optional email and Facebook credentials

Leave these blank for this release. For email OTP later, obtain `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and a verified `SMTP_FROM` sender from the selected mail service. The existing transport uses implicit TLS on port 465 and STARTTLS on port 587. Use the provider's SMTP/app credential and configure its required sender DNS records.

`FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET` belong to the optional existing Facebook integration. They are not required for the planned Google-first launch.

## 7. Release and verify both workspaces

1. Apply reviewed migrations separately with `npm run db:deploy -w backend` against the intended branch. Normal Vercel builds do not migrate production.
2. Run `npm run typecheck`, `npm test`, and `npm run build`. Run `npm run test:e2e` after the build; avoid rebuilding while the production test server runs.
3. Commit code and templates, excluding real secret files, then push `main`. Check **GitHub Actions → Verify SSC13BD** and **Vercel → Deployments** for the same commit. Their builds run independently.
4. Open the homepage and `/api/overview`; the API should report `mode: "live"`. Empty feeds are expected before members join. `/api/verification` should return 401 for signed-out visitors. Do not seed invented production members or emergencies.
5. Inspect Vercel build/runtime logs when diagnosing failures; keep connection strings and tokens out of logs. Retain the previous working deployment until the new one is healthy.

## 8. Rotate and recover credentials

Revoke/replace a compromised credential in its owning service, update the matching Vercel environment and local files, redeploy, and verify the affected integration. Update both Neon URLs when rotating their shared role password; schedule the change because old connections may fail. Rotating `NEXTAUTH_SECRET` signs users out. Rotate Google secrets independently from the session secret.

Keep recovery codes and account ownership access in the password manager. If a secret enters Git history, rotate it immediately and remove it from history; deleting the latest line does not invalidate the leaked value.
