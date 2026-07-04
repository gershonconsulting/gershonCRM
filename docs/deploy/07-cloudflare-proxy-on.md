# Phase 7 — Turn On Cloudflare Proxy

**Time:** 5 min. **Operator: CHARLES (browser).** Ariel verifies after.

**Critical:** SSL mode must be **Full (strict)** — anything else (especially Flexible) causes infinite redirect loops.

## 7.1 Instruction block for Charles

> Charles, in Cloudflare zone `gershonCRM.com`:
> 1. **SSL/TLS → Overview** → set encryption mode to **Full (strict)** (origin has a valid Let's Encrypt cert).
> 2. **SSL/TLS → Edge Certificates** → **Always Use HTTPS: ON**; **Minimum TLS Version: 1.2**; **Automatic HTTPS Rewrites: ON**.
> 3. **DNS → Records** → `crm` A record → click the grey cloud to turn it **orange (Proxied)**.
> 4. Optional: Security → Bot Fight Mode ON; a cache-bypass rule for `crm.gershoncrm.com/api/*`.
> Report back when done.

## 7.2 Ariel verifies

```bash
dig crm.gershoncrm.com +short     # now Cloudflare IPs (104.21.x / 172.67.x), NOT the VPS IP
curl -I https://crm.gershoncrm.com  # 200/302 with header: server: cloudflare
```

Browser check: page loads, DevTools shows `cf-ray` header, no redirect loop.

## Exit criteria

- [ ] Cloudflare IPs in DNS, `server: cloudflare` header, no loops, mode Full (strict)

Commit: `git commit --allow-empty -m "deploy: phase 7 complete - Cloudflare proxied" && git push`

## Troubleshooting

**ERR_TOO_MANY_REDIRECTS:** SSL mode is Flexible → set Full (strict). (Flexible speaks HTTP to origin; nginx redirects to HTTPS; loop.)
**525 SSL handshake failed:** origin cert broken — `sudo certbot certificates` must show VALID.
**521 Web server down:** nginx stopped or UFW blocking — check both.
