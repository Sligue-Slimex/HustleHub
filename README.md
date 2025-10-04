# HustleHub — Simple Vanilla JS app with Supabase

This project is a minimal, ready-to-deploy HustleHub web app built with plain HTML, CSS and JavaScript using Supabase for authentication, database and storage.

## What you get
- index.html, style.css, app.js
- sql.sql — SQL you can paste into Supabase SQL editor to create tables
- Instructions below to deploy on Vercel / GitHub

## Quick start (local testing)
1. Create a Supabase project at https://supabase.com
2. In the Supabase dashboard:
   - Go to Authentication -> Settings and configure Email auth.
   - Create a Storage bucket named `public` and set it public.
   - Open SQL editor and run `sql.sql` (paste the contents).
3. In Settings -> API copy `URL` and `anon key`.
4. For quick local testing, open `app.js` and replace SUPABASE_URL and SUPABASE_ANON_KEY constants with your project's values (or better: set environment variables on deployment).
5. Serve the folder (e.g. `npx http-server` or open `index.html`).

## Deploy to Vercel
1. Push this repo to GitHub.
2. In Vercel, import the GitHub repository.
3. Add two Environment Variables in project settings:
   - `SUPABASE_URL` = your Supabase URL
   - `SUPABASE_ANON_KEY` = your anon key
4. Build command: none (static). Output directory: `/`
5. Deploy.

## Notes & Improvements
- This is a starter minimal implementation. For production:
  - Implement server-side validations.
  - Move anon key to env vars (do not commit keys).
  - Implement listing updates (currently republish pattern).
  - Add payment integration (Stripe / Paynow) and premium features.
  - Add better error handling and UI polish.

Enjoy — you're ready to upload to GitHub and deploy to Vercel.
