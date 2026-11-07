# HOOKLABS

HOOKLABS is a dark-only Next.js intelligence platform for discovering, inspecting, and tracking Uniswap v4 hooks across Ethereum, Base, Arbitrum One, Unichain, and Robinhood Chain. It also hosts the configurable pre-launch $HOOKLB ecosystem, roadmap, announcements, and protected administration.

## Requirements

- Node.js 20.9 or newer
- pnpm 12
- Neon PostgreSQL and Neon Auth

## Local development

```bash
pnpm install --frozen-lockfile
cp .env.example .env.development.local
pnpm db:setup
pnpm dev
```

Configure the variables described in `.env.example` before running database, authentication, or cron-dependent functionality. The app uses public RPC endpoints defined in `lib/blockchain.ts`; unavailable or rate-limited providers are surfaced as unavailable rather than replaced with mock data.

## Validation and production

```bash
pnpm typecheck
pnpm build
pnpm start
```

`next start` listens on `PORT` when provided. The production server must be able to reach Neon, Tackle Hooks, and all configured blockchain RPC endpoints.

## Database and authentication

Set `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, and `HOOKLABS_ADMIN_EMAILS`. Run `pnpm db:setup` once against the intended database to create the idempotent indexer tables and indexes. The setup script does not drop or reset existing data.

Neon Auth handles sessions. Admin routes additionally require the signed-in email to appear in `HOOKLABS_ADMIN_EMAILS`. Keep the cookie secret and database URL server-only.

## Public website configuration

`public/config.json` is the single source of truth for public project identity, social links, token details, purchase controls, feature visibility, announcements, roadmap content, and branding colors. Edit it manually, validate the JSON, commit it, and publish a new deployment. Because the file is public, never place credentials, private keys, database URLs, unpublished secrets, or personal data in it.

Clients load `/config.json`, validate it with Zod, refresh it every 30 seconds while the page is active, and keep the last valid configuration when a refresh fails. On Vercel, a source edit becomes visible only after the updated deployment is published.

## Vercel Hobby deployment

1. Import `isansfri-lang/hooklabs` into Vercel.
2. Select pnpm and Node.js 20 or newer.
3. Add all required variables from `.env.example` to Production and Preview as appropriate.
4. Provision or connect Neon.
5. Run `pnpm db:setup` once against the production Neon database.
6. Deploy, then configure the custom domain in Vercel Project Settings.

`vercel.json` schedules `/api/indexer/sync` once daily at `0 0 * * *`, which is compatible with Vercel Hobby. Set `CRON_SECRET`; production requests without `Authorization: Bearer <CRON_SECRET>` are rejected. Live page requests still fetch current provider and RPC data on demand, while SWR uses bounded 30-second refresh intervals only while relevant pages are open. More frequent unattended indexing requires an external authenticated scheduler or worker.

## VPS or compatible Node.js hosting

1. Install Node.js 20+, pnpm, and a reverse proxy such as Nginx or Caddy.
2. Clone the repository and run `pnpm install --frozen-lockfile`.
3. Create a server-only environment file from `.env.example`.
4. Run `pnpm db:setup`, `pnpm typecheck`, and `pnpm build`.
5. Start `pnpm start` with a process manager such as systemd or PM2.
6. Proxy HTTPS traffic to the configured `PORT` and forward the original host/protocol headers.
7. Use an external daily scheduler to call `/api/indexer/sync` with the bearer `CRON_SECRET`.

PHP-only shared hosting cannot run this application. A Node.js runtime with persistent process support is required.

## External dependencies

- Neon PostgreSQL: index cache, checkpoints, and hook submissions
- Neon Auth: administrator sessions
- Tackle Hooks API: hook and pool discovery/index source
- Public chain RPC endpoints: contract inspection and network health
- Vercel Analytics: enabled automatically in production on Vercel
- Vercel Cron or an external scheduler: daily cache indexing

## Troubleshooting

- **Missing environment variables:** compare configured names with `.env.example`; never expose server secrets through `NEXT_PUBLIC_*`.
- **Database failures:** verify `DATABASE_URL`, TLS support, network access, and that `pnpm db:setup` completed.
- **Authentication callback or cookie failures:** verify `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, deployment URL, and Neon Auth allowed origins.
- **Admin access denied:** verify the authenticated email is listed in `HOOKLABS_ADMIN_EMAILS`.
- **RPC rate limits:** wait and retry, or replace public endpoints in `lib/blockchain.ts` with approved provider URLs before deployment.
- **Public configuration failures:** validate `public/config.json` against `lib/config.ts`; the app keeps its last valid client configuration and falls back to safe defaults on first load.
- **Cron returns 401:** set `CRON_SECRET` and send the matching bearer authorization header.
- **Build errors:** use the documented Node/pnpm versions, install from the lockfile, then run `pnpm typecheck` before `pnpm build`.
- **v0 Download ZIP fails:** this source tree contains no ZIP-generation endpoint. Use GitHub’s branch download (`Code` → `Download ZIP`) or contact Vercel support for v0 platform export failures.

## Security

Do not commit `.env` files, credentials, wallet keys, production database exports, `node_modules`, or `.next`. Security headers are configured in `next.config.mjs`, protected admin routes require authenticated authorization, and the cron endpoint requires a server-only shared secret outside development.
