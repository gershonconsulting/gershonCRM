# Phase 5 — Cloudflare DNS (Proxy OFF)

**Time:** 5 min. **Operator: CHARLES (browser).** Ariel: hand Charles the instruction block below, then verify.

**Critical:** proxy stays OFF (grey cloud) until Phase 7 — certbot must reach the VPS directly.

## 5.1 Instruction block for Charles

> Charles: in the Cloudflare dashboard, zone `gershonCRM.com` → DNS → Records → Add record:
> - Type: **A**
> - Name: **crm**
> - IPv4: **<VPS_IP>** (from 1Password "GershonCRM Deploy")
> - Proxy status: **DNS only** (grey cloud — click the orange cloud to toggle OFF)
> - TTL: Auto
> Save, then report back.

## 5.2 Ariel verifies

```bash
dig crm.gershoncrm.com +short
# Expect: <VPS_IP>. Empty -> wait 60s, retry. Cloudflare IP (104.21.x / 172.67.x) -> proxy is ON, Charles must toggle it OFF.

curl -I http://crm.gershoncrm.com
# Expect an nginx response (default page 200 or app response). "Connection refused" -> nginx down on VPS.
```

## Exit criteria

- [ ] `dig` returns the VPS IP
- [ ] `curl` reaches the VPS over HTTP

Next: 06-nginx-ssl.md
