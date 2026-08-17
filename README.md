# Pixel Candle

A quiet digital space for starting a study session. The candle is the clock: no timer, no countdown, no progress bar.

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Supabase

1. Create a Supabase project.
2. Enable anonymous sign-ins in Authentication.
3. Run `supabase/schema.sql` in the SQL editor.
4. Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Realtime active candle count uses Supabase Presence on `pixel-candle:study-room`. Persistent history and feedback use PostgreSQL tables with RLS policies.

## Scripts

```bash
npm run lint
npm run build
```
