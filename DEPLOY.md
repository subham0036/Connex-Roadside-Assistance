# Connex — share online (free tier)

Use this to give friends a **public link** before Play Store / custom domain.

## 1. MongoDB (already using Atlas)

- Keep `MONGO_URI` in backend env on the host.
- Atlas → Network Access → allow `0.0.0.0/0` (or Render’s IP) for cloud deploy.

## 2. Backend (Render — free)

1. Push code to GitHub.
2. [render.com](https://render.com) → New **Web Service** → connect repo, root: `backend`.
3. Build: `npm install` · Start: `npm start` (or `node server.js`).
4. Env: `MONGO_URI`, `JWT_SECRET`, `PORT=10000` (Render sets `PORT`).
5. Copy URL, e.g. `https://connex-api.onrender.com`.

Run seed once on Render shell: `npm run seed:admin` (admin login stays private).

## 3. Frontend (Vercel — free)

1. [vercel.com](https://vercel.com) → Import repo, root: `frontend`.
2. Env: `REACT_APP_API_URL=https://connex-api.onrender.com` (your Render URL).
3. Deploy → share `https://connex-xxx.vercel.app`.

## 4. Custom domain (later)

- Buy domain (GoDaddy, Namecheap, Cloudflare).
- Vercel: Project → Domains → add `app.yourdomain.com`.
- Render: Custom Domain → `api.yourdomain.com`.
- Update `REACT_APP_API_URL` to `https://api.yourdomain.com`.

## 5. Play Store (India)

A React website is **not** auto-listed on Play Store. Options:

| Option | Effort |
|--------|--------|
| **PWA** — “Add to Home Screen”, manifest + HTTPS | Low |
| **Capacitor** — wrap `frontend/build` in Android app | Medium |
| **TWA** (Bubblewrap) — Trusted Web Activity | Medium |

Minimum for Play Store: HTTPS site, privacy policy URL, signed APK/AAB, Google Play Console (~$25 one-time).

## 6. Share with friends today (no domain)

1. Deploy backend + frontend as above.
2. Send the **Vercel link**.
3. For phone testing, use the same URL in Chrome (allow location when asked).

## Local network only (same Wi‑Fi)

```bash
# Backend — note your laptop IP, e.g. 192.168.1.5
cd backend && npm run dev

# Frontend
REACT_APP_API_URL=http://192.168.1.5:5001 npm start
```

Friends on same Wi‑Fi: `http://192.168.1.5:3000` (firewall must allow ports 3000/5001).
