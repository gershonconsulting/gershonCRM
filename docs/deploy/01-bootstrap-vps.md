# Phase 1 — VPS Bootstrap & Hardening

**Time:** 15 min. **Operator:** Ariel. **Risk:** lockout — recovery is Hostinger VNC console.

## 1.1 Initial login as root

```bash
ssh root@<VPS_IP>    # root password from 1Password
apt update && apt upgrade -y
# If a kernel update asks for reboot: reboot, wait 60s, SSH back in.
```

## 1.2 Create a non-root sudo user

```bash
adduser deploy
# Set a strong password -> save to 1Password as "GershonCRM VPS deploy user password".
# Skip the Full Name/Room prompts (Enter through them).
usermod -aG sudo deploy
id deploy   # expect: groups=...(deploy),27(sudo)
```

## 1.3 SSH key auth for `deploy`

On the operator machine (NOT the VPS):

```bash
ssh-keygen -t ed25519 -C "operator@gershoncrm-vps" -f ~/.ssh/gershoncrm_vps -N ""
# Save private key to 1Password as "GershonCRM VPS SSH private key"
ssh-copy-id -i ~/.ssh/gershoncrm_vps.pub deploy@<VPS_IP>   # enter deploy password
ssh -i ~/.ssh/gershoncrm_vps deploy@<VPS_IP>               # must log in with NO password prompt
```

If it still asks for a password — stop and fix before continuing.

## 1.4 Lock down SSH

As `deploy` on the VPS, edit `/etc/ssh/sshd_config`:

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Then `sudo systemctl restart ssh`.

**Verify in a SECOND session before closing the first:**
1. `ssh root@<VPS_IP>` → must FAIL (Permission denied)
2. `ssh -i ~/.ssh/gershoncrm_vps deploy@<VPS_IP>` → must SUCCEED

Only close the original session when both behave correctly.

## 1.5 Firewall

```bash
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status   # OpenSSH, 80/tcp, 443/tcp all ALLOW
```

## 1.6 fail2ban

```bash
sudo apt install -y fail2ban
sudo systemctl enable --now fail2ban
sudo systemctl status fail2ban --no-pager | head -3   # active (running)
```

## 1.7 Base packages + hostname + timezone

```bash
sudo apt install -y build-essential git curl ca-certificates gnupg lsb-release htop
sudo hostnamectl set-hostname gershoncrm-vps
sudo timedatectl set-timezone America/New_York
```

## Exit criteria

- [ ] SSH as `deploy` with key works; as `root` fails; password auth fails
- [ ] UFW active, only 22/80/443
- [ ] fail2ban active

Commit (from the repo clone): `git commit --allow-empty -m "deploy: phase 1 complete - VPS hardened" && git push`

## Troubleshooting

**"Permission denied (publickey)" for deploy:** on VPS check `/home/deploy/.ssh` is 700, `authorized_keys` 600, owned deploy:deploy. Fix: `sudo chown -R deploy:deploy /home/deploy/.ssh && sudo chmod 700 /home/deploy/.ssh && sudo chmod 600 /home/deploy/.ssh/authorized_keys`

**Locked out:** Hostinger → VPS → Manage → VNC console → log in as root → undo the change.
