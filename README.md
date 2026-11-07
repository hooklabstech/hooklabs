# HOOKLABS

HOOKLABS is a dark-only Next.js intelligence platform for discovering, inspecting, and tracking Uniswap v4 hooks across Ethereum, Base, Arbitrum One, Unichain, and Robinhood Chain. It also hosts the configurable pre-launch $HOOKLB ecosystem, roadmap, announcements, and protected administration.

## Requirements

- Node.js 20.9 or newer
- pnpm 12
- Neon PostgreSQL and Neon Auth
- Vercel Blob

## Local development

```bash
pnpm install --frozen-lockfile
cp .env.example .env.development.local
pnpm db:setup
pnpm dev
```

Configure the variables described in `.env.example` before running database, authentication, Blob, or cron-dependent functionality. The app uses public RPC endpoints defined in `lib/blockchain.ts`; unavailable or rate-limited providers are surfaced as unavailable rather than replaced with mock data.

## Validation and production

```bash
pnpm typecheck
pnpm build
pnpm start
```

`next start` listens on `PORT` when provided. The production server must be able to reach Neon, Vercel Blob, Tackle Hooks, and all configured blockchain RPC endpoints.

## Database and authentication

Set `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, and `HOOKLABS_ADMIN_EMAILS`. Run `pnpm db:setup` once against the intended database to create the idempotent indexer tables and indexes. The setup script does not drop or reset existing data.

Neon Auth handles sessions. Admin routes additionally require the signed-in email to appear in `HOOKLABS_ADMIN_EMAILS`. Keep the cookie secret and database URL server-only.

## Runtime configuration and Vercel Blob

Set `BLOB_READ_WRITE_TOKEN`. Protected admin writes create immutable JSON versions under `hooklabs/config/versions/`; the newest version is read at runtime with `no-store`, validated with Zod, and refreshed by public clients every 30 seconds. Routine token, roadmap, announcement, social, and branding edits therefore do not require a redeployment.

The configuration objects are publicly readable because the current Blob implementation writes them with public access. Never store credentials, private keys, unpublished secrets, or personal data in runtime configuration. GitHub source archives do not include Blob data.

## Vercel Hobby deployment

1. Import `isansfri-lang/hooklabs` into Vercel.
2. Select pnpm and Node.js 20 or newer.
3. Add all required variables from `.env.example` to Production and Preview as appropriate.
4. Provision or connect Neon and Vercel Blob.
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
- Vercel Blob: versioned runtime configuration
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
- **Runtime configuration failures:** verify `BLOB_READ_WRITE_TOKEN`; the app falls back to safe defaults when Blob is unavailable.
- **Cron returns 401:** set `CRON_SECRET` and send the matching bearer authorization header.
- **Build errors:** use the documented Node/pnpm versions, install from the lockfile, then run `pnpm typecheck` before `pnpm build`.
- **v0 Download ZIP fails:** this source tree contains no ZIP-generation endpoint. Use GitHub’s branch download (`Code` → `Download ZIP`) or contact Vercel support for v0 platform export failures.

## Security

Do not commit `.env` files, credentials, wallet keys, production database exports, Blob configuration content, `node_modules`, or `.next`. Security headers are configured in `next.config.mjs`, all admin writes require authenticated authorization, and the cron endpoint requires a server-only shared secret outside development.
