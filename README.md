# SSC13BD

A mobile-first community home for Bangladesh’s SSC batch of 2013. Built with Next.js App Router, TypeScript, Tailwind CSS 4, TanStack Query, Auth.js/NextAuth, Prisma, and Neon PostgreSQL.

## Run locally

Requires Node.js 22 and npm. From the repository root:

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

## Credentials and current deployment

Both the frontend and backend API are deployed at **https://ssc13bd.vercel.app** in one Vercel project. Neon is migrated; login providers remain unconfigured for this release. Visitors can explore the live site; posting, RSVP, and moderation require authentication and the existing access checks.

Follow the [step-by-step credential guide](docs/credentials.md) for local files, Neon, Vercel environments, and the future Google OAuth client. Next.js reads `frontend/.env.local`; root `.env.local` is an operator reference, and `backend/.env` supplies Prisma CLI settings. Preserve existing secret files. Commit only blank `.env.example` templates.

Google sign-in for both members and administrators is planned for the next iteration. Its placeholder variables do not enable a provider yet. Email OTP and Facebook can stay blank. The [community roadmap](docs/community-roadmap.md) records the worldwide member map, animated connections to Bangladesh, mutual aid, and overseas job referrals.

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

GitHub repository `proffesergio/ssc13bd` is connected to Vercel project `newellx/ssc13bd`, with `main` as the production branch. GitHub Actions verifies pushes independently of Vercel's deployment build; check both before considering a release healthy.
