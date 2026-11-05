# SSC13BD

A mobile-first community home for Bangladesh’s SSC batch of 2013. Built with Next.js App Router, TypeScript, Tailwind CSS 4, TanStack Query, Auth.js/NextAuth, Prisma, and Neon PostgreSQL.

## Run locally

Requires Node.js 22+ and npm. From the repository root:

```sh
npm ci
npm run db:generate
npm run dev
```

Open http://localhost:3000. With no `DATABASE_URL`, the app runs a **clearly labeled, read-only community preview** with synthetic people and events. Nothing in the preview represents a real emergency. Mutations return an explicit configuration error; no fake sign-ins or browser-only persistence.

## Workspaces

- `frontend/`: Next.js app, responsive community UI, Tailwind design tokens, TanStack Query cache, and thin serverless API wrappers.
- `backend/`: Prisma schema and migrations, authentication, input validation, access policies, API handlers, seed script, and backend tests. There is no separate always-on server.
- `.github/workflows/ci.yml`: type checks, business/security tests, and production build on pushes and pull requests.

Routes: `/` dashboard, `/directory` professional search and district view, `/sos` help requests and response threads, `/events` regional meetups and memory walls, `/expenses` BDT bill splitter and private ledger, `/verification` onboarding and profile settings, `/admin` moderator review queue.

## Connect Neon and authentication

1. Create a Neon PostgreSQL project and database. Use the **pooled** connection string for `DATABASE_URL` and the direct connection for `DIRECT_URL`. Append `connection_limit=1&pool_timeout=10` to the pooled URL for conservative serverless connection use.
2. Copy `frontend/.env.example` to `frontend/.env.local` and fill values. Never commit the resulting file. Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`.
3. Supply both database variables to your shell when running Prisma commands from the root. Prisma reads `backend/.env` for CLI commands; Next.js reads `frontend/.env.local`. You can create an ignored `backend/.env` with just database settings for local CLI work.
4. Run `npm run db:generate`, then `npm run db:deploy -w backend` to apply the committed SQL migration. Use a separate Neon development branch for schema changes.
5. Configure SMTP credentials to enable six-digit email OTP. Codes expire after ten minutes, have limited attempts, and are hashed with the auth secret. Facebook sign-in needs a Meta application with the Facebook Login product, approved permissions, and callback `https://ssc13bd.vercel.app/api/auth/callback/facebook` (localhost during local development).
6. Sign in once, then run the backend seed command with `MODERATOR_EMAIL` set to deliberately promote the first moderator. See `backend/README.md`. The seed does not create fake accounts or auto-approve SSC membership.

Users submit SSC board, school, roll, and registration for private moderator review. Approved members may post SOS requests, respond, RSVP, and save expenses. Directory listing is an explicit opt-in. Batch badges confirm membership, **not professional licensing**. Only moderators/admins create meetups. Attending members can share public HTTPS photo links to an event timeline; binary file hosting is not included.

## Verify changes

```sh
npm run typecheck
npm test
npm run build
npm run test:e2e
```

The browser suite starts the production server after `npm run build` and runs against the local read-only preview and covers navigation, directory filters, forms, responsive layout, and split arithmetic. Install Chromium first with `npx playwright install chromium` if needed, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to an installed Chrome binary. Database-backed authentication, moderator decisions, and concurrency require a configured staging database and real provider credentials.

## Deploy with Vercel’s Git integration

1. Push this workspace to a GitHub repository with `main` as the production branch. Import it into Vercel and select **Root Directory: `frontend`**. Enable **Include source files outside of the Root Directory** so the backend workspace is packaged.
2. `frontend/vercel.json` runs `npm ci` and the root build, including Prisma generation. Keep the default Next.js output directory. Node.js 22 is recommended.
3. Set database/auth/SMTP environment variables in Vercel. Set `NEXTAUTH_URL=https://ssc13bd.vercel.app` for production. Preview deployments should use a separate Neon branch and matching auth URLs/providers.
4. Apply database migrations deliberately with `npm run db:deploy -w backend` before deploying code that needs the new schema. Builds never mutate a production database.
5. Choose project name `ssc13bd` if available. Vercel assigns `ssc13bd.vercel.app` only if that name is available to the account. Future GitHub pushes deploy automatically; pull requests receive previews.

There are no paid service assumptions, cron jobs, websocket servers, or background workers. Queries are bounded and district/profession/verification fields are indexed. RSVP capacity checks are transactional. Event counts refresh every minute; SOS notifications are dashboard indicators polled while a member is active, not web push. Free-tier quotas still apply to hosting, email, and database providers.

## Design

Warm ivory surfaces, forest-green accents, editorial serif headings, restrained bento cards, Bangladesh-inspired illustration, keyboard-friendly dialogs, and reduced-motion support. Inspiration research: [Circle community platform](https://circle.so/platform) and [member directory patterns](https://help.circle.so/p/audience/member-management). The requested 12ui and Superdesign workflows were attempted, but their hosted APIs were unavailable in this environment; no hosted design output is claimed.

GitHub CI verifies every push. Vercel Git integration requires a GitHub Login Connection in the Vercel account; without that account connection, use the Vercel CLI for deployment until the repository can be linked.
