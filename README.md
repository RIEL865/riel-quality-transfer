# RIEL Quality Transfer + TikTok Direct Post

This project adds a TikTok Login Kit + Content Posting API Direct Post flow to the existing RIEL Quality Transfer page.

## Important
GitHub Pages can host the front end, but TikTok's client secret must stay on a server. This version is designed to deploy as a single Vercel project so the static site and `/api` functions live together.

## TikTok Developer Portal setup
1. Add **Login Kit** for **Web**.
2. Add **Content Posting API** and enable **Direct Post**.
3. Request `video.publish` (and keep the default `user.info.basic`).
4. After deploying this project to Vercel, register this exact redirect URI under Login Kit > Web:
   `https://YOUR-VERCEL-DOMAIN/api/tiktok/callback`
5. In Vercel, add the environment variables from `.env.example`.
6. Redeploy after adding/changing environment variables.

## Local development
Install Vercel CLI, copy `.env.example` to `.env.local`, fill in values, then run `vercel dev`.

## Flow
The browser selects the video locally. TikTok authorization is handled server-side. The server calls Creator Info before Direct Post, then initializes a FILE_UPLOAD post. The browser uploads the selected file to TikTok's returned upload URL and the server checks the publish status.

## Security
Never put `TIKTOK_CLIENT_SECRET` in `index.html` or client-side JavaScript. Do not commit real `.env` files or secrets to GitHub.

## Review / audit
Unaudited Direct Post clients are restricted by TikTok (including private-only posting and user caps). Follow TikTok's current developer and product-use guidelines before submitting for review. 
