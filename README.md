# chatbot-webui

Vue 3 + Vite + TypeScript company chatbot UI (Tailwind, shadcn-vue, Inter, PWA).

## Local Docker (with API + Postgres)

From `chatbot-api`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\.armin\docker-scripts\run-on-docker-local.ps1
```

- Dev URL: `http://localhost:5184`
- API (proxied inside Docker): `http://api:8134`
- Default login: `armin` / `dopadopa123`

## Local setup (Vite on the host)

```powershell
npm install
npm run dev
```

- Dev URL: `http://localhost:5184`
- API (proxied): `http://127.0.0.1:8134`
- Default login: `armin` / `dopadopa123`

Chat replies need `chatbot-api` running. Set the cursor-api gateway key in **Admin → Settings**. A saved key shows as `**********`.

This UI is a support guide for the distribution ERP. Chat bubbles follow Persian (RTL) or English (LTR) from the text. Search and delete chats from Chat or History. Admins manage users at `/admin/users`. Dark theme is the default; use the header toggle for light.
