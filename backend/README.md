# SSC13BD backend

Shared server package imported by the Next.js frontend. PostgreSQL persistence uses Prisma and a Neon pooled runtime connection. Authentication uses Auth.js/NextAuth v4 with single-use email codes and optional Facebook OAuth. Batch membership approval never certifies professional qualifications.

## Setup

From the repository root:

```sh
npm install
npm run generate --workspace @ssc13bd/backend
npm run db:deploy --workspace @ssc13bd/backend
npm run db:seed --workspace @ssc13bd/backend
npm test --workspace @ssc13bd/backend
```

Copy `.env.example` values to `backend/.env` for Prisma commands and to the frontend's `.env.local` for runtime. Use Neon's pooled connection for `DATABASE_URL` and its direct connection for `DIRECT_URL`. Use a strong random `NEXTAUTH_SECRET`; configure the canonical `NEXTAUTH_URL`. Set working SMTP credentials to enable email codes. Facebook requires an application with a matching `/api/auth/callback/facebook` redirect URL. Do not enable automatic email account linking: existing email accounts must sign in using their original provider or email code.

The committed initial migration provisions the schema with `db:deploy`; run it separately from the Vercel build against the direct database connection. `db:push` is available for disposable development databases only. For subsequent production changes, create reviewed migrations with `npm run db:migrate --workspace @ssc13bd/backend -- --name description`, commit the generated migration, and apply using `npm run db:deploy --workspace @ssc13bd/backend`. Back up the database before schema changes.

The seed grants moderator access only to emails explicitly listed in `MODERATOR_EMAILS`. It does not automatically approve SSC membership. Two moderators are needed to review each other's batch applications because self-approval is forbidden. No illustrative data is inserted into a real community database.

## Frontend integration

Configure `transpilePackages: ['@ssc13bd/backend']`. In `app/api/[...path]/route.ts`, export `handleApiRequest` as GET, POST, PATCH, and DELETE, using the Node.js runtime. In `app/api/auth/[...nextauth]/route.ts`, pass `authOptions` to `NextAuth`. Fetch `/api/config` before presenting enabled sign-in providers. Authenticate email codes using `signIn('credentials', {email, code, redirect: false})` after requesting a code.

All API mutations require a same-origin `Origin` header and JSON bodies where relevant. All responses disable caching. Errors return `{error, code}`. Batch members control directory visibility. Public directory records omit account emails, contact data, board rolls, registration numbers and review data. Raw verification identifiers are available only to moderators for manual review, never the public directory. The owner's status endpoint omits these identifiers too. Restrict production database access to trusted operators, enable encrypted backups, and apply an approved retention policy to verification identifiers and expired OTP records.

## Routes

| Route | Behavior |
| --- | --- |
| GET `/api/config` | Backend mode and configured sign-in providers |
| GET `/api/overview` | Public counts and sample feed from actual stored records |
| GET `/api/directory?q=&profession=&district=` | Public, opted-in, batch-verified profiles; maximum 100 |
| GET `/api/sos` | Open requests; maximum 100 |
| POST `/api/sos` | Verified members create requests and district/profession-targeted dashboard notifications atomically |
| PATCH `/api/sos/:id` | Owner or moderator resolves a request with `{status:'RESOLVED'}` |
| GET `/api/events` | Upcoming events with counts and current user's RSVP state |
| POST `/api/events` | Batch-verified moderators and admins create future events |
| POST, DELETE `/api/events/:id/rsvp` | Verified members join/leave; row locking enforces capacity and uniqueness |
| GET, POST `/api/expenses` | Verified member's private ledger; integer `totalPaisa`, `participants`, `title` |
| POST `/api/otp/request` | Rate-limited SMTP delivery, single-use 10-minute code, five attempts |
| GET, PATCH `/api/me` | Own profile and filtered verification status; updates cannot change role or membership |
| POST `/api/verification` | Submit board, roll, registration, school, passingYear=2013 for manual review |
| GET `/api/verification` | Moderator-only pending applications, including private review fields |
| PATCH `/api/verification/:id` | Moderator review with status APPROVED/REJECTED and reviewNote; cannot self-approve |
| GET, POST `/api/sos/:id/responses` | Verified members read and post help offers; new offers notify the author |
| GET, POST `/api/events/:id/photos` | Verified members view shared photos; RSVP attendees or admins share HTTPS photo URLs with captions |
| GET `/api/notifications` | Verified member's own targeted dashboard notifications |
| PATCH `/api/notifications/:id` | Mark own notification read |

Without `DATABASE_URL`, supported GETs return `mode:'demo'` with explicitly synthetic preview records. All mutations return 503 and never claim to persist. Email/Facebook authentication and live database integration cannot be exercised without external credentials. Tests cover identity validation, privacy projections, targeting, role checks, privilege-field stripping, exact expense arithmetic, and event validation. Deployment verification must additionally exercise real SMTP, OAuth callbacks, concurrent RSVP requests, cross-account ownership, and moderator review against an isolated PostgreSQL database.
