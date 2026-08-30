# DateNight Backend

Node.js/Express + TypeScript + Prisma (PostgreSQL) + Redis API for the DateNight
collaborative date/group activity planning app.

## Features (MVP)

- Accounts: register / login (JWT), GDPR soft-delete (`DELETE /api/auth/me`)
- Groups: create, list, detail with members
- Invitations: 5 methods (LINK, EMAIL, SMS, QR, USERNAME), 72h expiry, accept via token
- Date proposals: 3-5 activity options each, counter-proposals
- Voting: approval voting, automatic majority consensus -> proposal DECIDED
- Suggestions: randomized activity suggestions, category filter, cached (Redis in
  prod, in-memory in dev), <1s retrieval

## Quick start (dev)

```bash
cp .env.example .env          # adjust DATABASE_URL if needed
npx prisma migrate dev        # create/update schema
npm run dev                   # tsx watch mode on :3000
```

## Commands

- `npm run dev` — watch mode
- `npm run build` — compile to dist/ (tsc + tsc-alias)
- `npm start` — run compiled server
- `npm test` — Jest suite
- `npm run typecheck` / `npm run lint`

## API summary

| Method | Path | Description |
|---|---|---|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login, returns JWT |
| GET | /api/auth/me | Current user |
| DELETE | /api/auth/me | GDPR soft delete |
| POST | /api/groups | Create group |
| GET | /api/groups | My groups |
| GET | /api/groups/:id | Group detail |
| POST | /api/invitations | Invite to group (LINK/EMAIL/SMS/QR/USERNAME) |
| POST | /api/invitations/accept/:token | Accept invite |
| POST | /api/proposals | Create proposal (3-5 options) |
| GET | /api/proposals/:id | Detail + vote tally + consensus |
| POST | /api/proposals/:id/counter | Counter-proposal |
| POST | /api/proposals/:id/vote | Approval vote (auto-DECIDED on majority) |
| GET | /api/proposals/suggestions/list | Randomized suggestions (?category=&lat=&lng=) |

All routes except /health, register, and login require `Authorization: Bearer <jwt>`.

## Deploy (Google Cloud Run)

```bash
gcloud run deploy datenight-api --source . --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,JWT_SECRET=...,DATABASE_URL=...,REDIS_URL=...
```

Use Cloud SQL (PostgreSQL) for DATABASE_URL and Memorystore for REDIS_URL.
Migrations: `npx prisma migrate deploy` against the production DATABASE_URL.
