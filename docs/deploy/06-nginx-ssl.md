# Phase 6 — nginx + SSL

**Time:** 10 min. **Operator:** Ariel.

## 6.1 nginx site config

Create `/etc/nginx/sites-available/crm.gershoncrm.com`:

```nginx
server {
    listen 80;
    server_name crm.gershoncrm.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }

    client_max_body_size 20M;   # CSV imports
}
```

```bash
sudo ln -s /etc/nginx/sites-available/crm.gershoncrm.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
curl -I http://crm.gershoncrm.com   # now answered by the Node app (200 or 302), not the nginx default page
```

## 6.2 Issue certificate

```bash
sudo certbot --nginx -d crm.gershoncrm.com
```

Answers: email `olivier@gershonconsulting.com` · agree ToS · N to EFF mail · **2 (redirect HTTP→HTTPS)**.

Certbot rewrites the nginx config for 443 + redirect. Don't hand-edit afterward — certbot manages renewals.

## 6.3 Verify

```bash
curl -I https://crm.gershoncrm.com   # HTTP/2 200 or 302, valid cert (no -k needed)
curl -I http://crm.gershoncrm.com    # 301 -> https
sudo systemctl list-timers | grep certbot   # certbot.timer active (auto-renew)
```

## Exit criteria

- [ ] HTTPS loads with valid Let's Encrypt cert; HTTP redirects; certbot.timer active

Commit: `git commit --allow-empty -m "deploy: phase 6 complete - SSL live" && git push`

## Troubleshooting

**"Challenge failed":** DNS not propagated (`dig` must return VPS IP) / Cloudflare proxy ON (must be OFF) / UFW blocking 80.
**HTTPS refused after issue:** `sudo ufw allow 443/tcp`; `sudo nginx -t && sudo systemctl reload nginx`.
**502 Bad Gateway:** app down — `pm2 status`, `pm2 logs gershoncrm --err`.
