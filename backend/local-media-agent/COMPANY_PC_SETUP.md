# Company PC Setup

Copy this whole `local-media-agent` folder to the company computer that can access the old media drive, for example:

```text
D:\ABK\local-media-agent
```

Then run this one time in PowerShell:

```powershell
cd D:\ABK\local-media-agent
powershell -ExecutionPolicy Bypass -File .\INSTALL_ON_COMPANY_PC.ps1
```

The installer will:

- create a Python virtual environment;
- install dependencies;
- create `.env` with a secure token;
- add `ABK Local Media Agent.lnk` to Windows Startup;
- start the agent immediately.

After that, the agent starts automatically whenever Windows logs in.

## Check

Double-click:

```text
CHECK_AGENT.bat
```

or open:

```text
http://127.0.0.1:5055/health
```

## Stop Manually

Double-click:

```text
STOP_AGENT.bat
```

## Start Manually

Double-click:

```text
START_AGENT_NOW.bat
```

## Connect It To The Online Web App

The company computer is still private. For Vercel to read photos through this agent, expose it safely with Cloudflare Tunnel.

Once you have a public tunnel URL, set these Vercel env vars on `abk-backend`:

```env
MEDIA_AGENT_URL=https://your-tunnel-url
MEDIA_AGENT_TOKEN=the-token-from-.env
```

Then redeploy the backend:

```powershell
cd D:\project\abk\ABK_APP\backend\api-gateway
npx vercel deploy --prod --yes
```
