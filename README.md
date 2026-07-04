# GershonCRM

A Streak.com-style CRM built as a **standalone platform** (no Gmail integration) for Gershon Consulting clients — global B2B companies entering the US market.

**Production:** `https://crm.gershonCRM.com` *(live after first deploy)*

## Quick links

- **Deploying?** Operators start at [`docs/ARIEL_MISSION.md`](./docs/ARIEL_MISSION.md)
- **Project background** → [`docs/HANDOFF.md`](./docs/HANDOFF.md)
- **Full deployment runbook** → [`docs/DEPLOY.md`](./docs/DEPLOY.md)

## Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind, shadcn/ui, dnd-kit, React Query, Wouter
- **Backend:** Node.js 20, Express, Drizzle ORM, Passport (local strategy)
- **Database:** PostgreSQL 16
- **AI:** OpenAI API
- **Infra:** Hostinger KVM VPS, PM2, nginx, Let's Encrypt, Cloudflare, GitHub Actions CI/CD

## Local development

```bash
npm ci
cp .env.example .env    # fill DATABASE_URL, SESSION_SECRET, OPENAI_API_KEY
npm run db:push
npm run dev             # http://localhost:5000
```

## Project layout

```
client/              React + Vite frontend
server/              Express + Drizzle backend
shared/              Shared types + Drizzle schema
docs/                Deployment docs (start: ARIEL_MISSION.md)
  deploy/            Phase-by-phase runbook (01-09)
.github/workflows/   CI/CD — auto-deploy to VPS on push to main
attached_assets/     Reference data (MAbSilico Streak export)
```

## Deploy

Push to `main` → GitHub Actions SSHes into the VPS → pull, rebuild, `pm2 restart`. First-time VPS setup: `docs/DEPLOY.md`.

## License

Proprietary — © Gershon Consulting LLC.
