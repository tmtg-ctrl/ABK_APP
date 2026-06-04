# ABK Local Media Agent

This small Flask app runs on the office computer that can access the old `D:\...` media folders.

## Setup

```powershell
cd backend\local-media-agent
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `.env`:

```env
MEDIA_AGENT_TOKEN=make-a-long-random-token
MEDIA_AGENT_HOST=127.0.0.1
MEDIA_AGENT_PORT=5055
MEDIA_AGENT_ALLOWED_ROOTS=D:\
```

Run:

```powershell
python app.py
```

## Expose safely

Use Cloudflare Tunnel or Tailscale Funnel. Do not open the port directly to the internet.

The Vercel backend needs:

```env
MEDIA_AGENT_URL=https://your-tunnel-url
MEDIA_AGENT_TOKEN=the-same-token
```
