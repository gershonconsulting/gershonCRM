# Phase 8 — GitHub Actions Auto-Deploy

**Time:** 10 min. **Operators:** Ariel (VPS key) + **Charles** (GitHub Secrets UI).

The workflow YAML ships as a template at `docs/deploy/deploy.yml.template` (it could not be pushed directly to `.github/workflows/` — the doc-push PAT lacked workflow scope). **First step of this phase:** move it into place and push with your PAT (which has `workflow` scope):

```bash
mkdir -p .github/workflows
git mv docs/deploy/deploy.yml.template .github/workflows/deploy.yml
git commit -m "ci: enable auto-deploy workflow"
git push
```

This push triggers a run that fails (secrets missing) — expected. Then wire the credentials below.

## 8.1 Ariel: deploy SSH key on the VPS

Separate from the Phase 1 operator key — scoped to Actions only, independently rotatable.

```bash
ssh-keygen -t ed25519 -C "github-actions-gershoncrm" -f ~/.ssh/github_actions -N ""
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_actions
# Save the ENTIRE private key (both BEGIN/END fences) to 1Password as
# "GershonCRM GitHub Actions SSH key" so Charles can paste it into the Secrets UI.
```

## 8.2 Instruction block for Charles

> Charles: GitHub → `gershonconsulting/gershonCRM` → Settings → Secrets and variables → Actions → New repository secret. Create three:
> | Name | Value |
> |---|---|
> | `VPS_HOST` | the VPS public IP (1Password) |
> | `VPS_USER` | `deploy` |
> | `VPS_SSH_KEY` | the private key from 1Password "GershonCRM GitHub Actions SSH key" — include the BEGIN/END lines |
> Report back when all three are saved.

## 8.3 Ariel: trigger + verify

```bash
git commit --allow-empty -m "deploy: phase 8 - trigger first Actions run" && git push
```

GitHub → Actions tab → "Deploy to VPS" run → green in ~1–2 min.

Then prove it end-to-end: make a visible change (e.g., edit a string in `client/src/pages/not-found.tsx`), push, confirm it appears on the live site after the green run. Revert the change after.

## Exit criteria

- [ ] Green Actions run on push; visible change deployed automatically; 3 secrets set

## Troubleshooting

**"Permission denied (publickey)" in Actions log:** `VPS_SSH_KEY` malformed (missing fences/extra whitespace) or pub key not in `authorized_keys`.
**Deploy green but site unchanged:** `pm2 status` on VPS; or Cloudflare cache — purge once.
**Build OOM on small VPS:** add 2G swap:
```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```
