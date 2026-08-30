# TogetherPlans

Collaborative date and group activity planning app.

## Structure

- `backend/` — Node.js/Express + TypeScript API (Cloud Run)
- `ios/` — iOS app (coming soon)
- `android/` — Android app (coming soon)

## API

Live: https://api.togetherplans.app

See `backend/README.md` for full API docs.

## Development

```bash
cd backend
cp .env.example .env
npx prisma migrate dev
npm run dev
```
