# Deployment

This repo is ready for a Render Blueprint deployment.

## 1. Rotate the Google service account key

`chiakhoa.json` contains a private key and is intentionally ignored by Git. Revoke that key in Google Cloud and create a new key before deploying.

## 2. Deploy on Render

1. Push this repo to GitHub.
2. In Render, create a new Blueprint and select this repository.
3. Render will read `render.yaml` and create:
   - `abk-frontend`
   - `abk-api-gateway`
   - `abk-python-workers`
   - `abk-redis`
4. When Render prompts for `sync: false` values, enter:
   - `VITE_API_BASE_URL`: the public URL of `abk-api-gateway`, for example `https://abk-api-gateway.onrender.com`
   - `CORS_ORIGIN`: the public URL of `abk-frontend`, for example `https://abk-frontend.onrender.com`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
   - `CONSTRUCTION_SHEET_NAME`

For the Google private key, paste the value with escaped newlines, like:

```env
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## 3. Local production check

```bash
cd frontend
npm ci
npm run build

cd ../backend/api-gateway
npm ci
npm test
```

## 4. Optional Vercel frontend

You can also deploy only `frontend/` to Vercel:

1. Import the GitHub repo in Vercel.
2. Set Root Directory to `frontend`.
3. Set `VITE_API_BASE_URL` to the deployed API URL.
4. Build command: `npm run build`
5. Output directory: `dist`
