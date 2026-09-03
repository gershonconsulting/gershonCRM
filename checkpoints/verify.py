#!/usr/bin/env python3
"""
Checkpoint verifier — the second gate of the Ariel <-> Charles protocol.

Charles CLAIMS a checkpoint is done. This script is the only thing allowed to
call it VERIFIED, and the only thing allowed to call it DISPUTED.

v1.1: every checkpoint is checked on every run, including OPEN ones. What is
being verified is the OUTCOME in the world, not whether someone clicked. So an
open checkpoint whose outcome is already true closes itself, and one that is
not carries the live reason it is still open.

Usage:
    python3 checkpoints/verify.py                 # verify this repo, rewrite INDEX.md
    python3 checkpoints/verify.py --dry-run       # report only, touch nothing
    python3 checkpoints/verify.py --rollup DIR    # sweep every repo clone under DIR

Stdlib only. No pip install, no network libs beyond urllib.
"""

import argparse, datetime, json, os, re, socket, ssl, sys, urllib.request, urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
UA = "GershonCheckpointVerifier/1.0"
TIMEOUT = 20

MARKER = {
    "OPEN": "❌", "CLAIMED": "\U0001f7e1", "VERIFIED": "✅",
    "DISPUTED": "\U0001f534", "BLOCKED": "⛔", "CANCELLED": "⚪",
}
ORDER = ["DISPUTED", "BLOCKED", "CLAIMED", "OPEN", "VERIFIED", "CANCELLED"]


# ---------------------------------------------------------------- front-matter

def parse(path):
    """Minimal YAML front-matter reader. Handles scalars, one level of nesting,
    and '- ' lists. Deliberately tiny so it needs no dependency."""
    raw = open(path, encoding="utf-8").read()
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", raw, re.S)
    if not m:
        return None, raw, raw
    body, fm, out, stack = m.group(2), m.group(1), {}, [(-1, None)]
    cur, curkey = out, None
    for line in fm.split("\n"):
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        indent = len(line) - len(line.lstrip())
        s = line.strip()
        if s.startswith("- "):
            tgt = cur.setdefault(curkey, [])
            if isinstance(tgt, list):
                tgt.append(_scalar(s[2:]))
            continue
        while stack and indent <= stack[-1][0]:
            stack.pop()
        container = stack[-1][1] if stack and stack[-1][1] is not None else out
        if ":" not in s:
            continue
        k, _, v = s.partition(":")
        k, v = k.strip(), v.strip()
        if v in ("", "{}", "[]"):
            container[k] = {} if v != "[]" else []
            stack.append((indent, container[k] if v != "[]" else container))
            cur, curkey = container, k
            if v != "[]":
                cur = container[k]
            continue
        container[k] = _scalar(v)
        cur, curkey = container, k
    return out, body, raw


def _scalar(v):
    v = v.strip().strip('"').strip("'")
    if v.lower() in ("true", "false"):
        return v.lower() == "true"
    if re.fullmatch(r"-?\d+", v):
        return int(v)
    return v


def set_status(path, new_status, note):
    """Rewrite only the status: line and append one history: line. Everything else in
    the file — including whatever Charles typed — is preserved byte for byte."""
    raw = open(path, encoding="utf-8").read()
    raw, n = re.subn(r"(?m)^status:.*$", "status: %s" % new_status, raw, count=1)
    if not n:
        return False
    entry = '  - %s verify %s "%s"' % (
        datetime.date.today().isoformat(), new_status, note.replace('"', "'"))
    close = raw.find("\n---", 4)          # closing fence of the front-matter
    if close == -1:
        return False
    raw = raw[:close] + "\n" + entry + raw[close:]
    open(path, "w", encoding="utf-8").write(raw)
    return True


# -------------------------------------------------------------------- checks

def _get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT, context=ctx) as r:
            return r.status, r.read(400000).decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception as e:
        return None, "ERR:%s" % e


def run_check(v):
    """Return (passed: bool|None, detail: str). None = cannot decide (manual)."""
    t = (v.get("type") or "").strip()

    if t == "dns":
        host = v.get("host", "")
        try:
            ips = sorted({a[4][0] for a in socket.getaddrinfo(host, None)})
        except Exception as e:
            return False, "%s does not resolve (%s)" % (host, e)
        want = v.get("expect_ip")
        if want and want not in ips:
            return False, "%s resolves to %s, expected %s" % (host, ",".join(ips), want)
        return True, "%s resolves to %s" % (host, ",".join(ips))

    if t in ("http", "http-contains", "http-absent"):
        url = v.get("url", "")
        code, body = _get(url)
        if code is None:
            return False, "%s unreachable (%s)" % (url, body[:120])
        want = int(v.get("expect_status", 200))
        if t == "http":
            return (code == want), "%s returned HTTP %s (expected %s)" % (url, code, want)
        if code != want:
            return False, "%s returned HTTP %s (expected %s)" % (url, code, want)
        needle = v.get("expect_text") or v.get("absent_text") or ""
        present = needle.lower() in body.lower()
        if t == "http-contains":
            return present, ("found %r" % needle) if present else ("%r NOT found at %s" % (needle, url))
        return (not present), ("%r is gone" % needle) if not present else ("%r is still present at %s" % (needle, url))

    if t == "repo-file":
        url = "https://raw.githubusercontent.com/%s/%s/%s" % (
            v.get("repo", ""), v.get("ref", "main"), v.get("path", ""))
        code, _ = _get(url)
        return (code == 200), "%s -> HTTP %s" % (url, code)

    if t == "manual-attest":
        return None, "no machine check possible; needs a countersign"

    return False, "unknown verify type %r" % t


# ------------------------------------------------------------------- driver

def collect(root):
    d = os.path.join(root, "checkpoints")
    if not os.path.isdir(d):
        return []
    out = []
    for f in sorted(os.listdir(d)):
        if f.startswith("CP-") and f.endswith(".md"):
            p = os.path.join(d, f)
            fm, _, _ = parse(p)
            if fm:
                out.append((p, fm))
    return out


def verify_repo(root, dry=False, log=True):
    rows, changes = [], 0
    for path, fm in collect(root):
        status = str(fm.get("status", "OPEN")).upper()
        v = fm.get("verify") or {}
        detail, new = "", status

        if status == "CANCELLED":
            detail = "withdrawn"
        elif status == "OPEN":
            # v1.1: check OPEN checkpoints too. What matters is whether the
            # outcome is true in the world, not whether anyone claimed it. An
            # open checkpoint whose outcome is ALREADY true closes itself; one
            # that is not shows the live reason it is still open.
            ok, detail = run_check(v if isinstance(v, dict) else {})
            if ok is None:
                detail = "manual-attest, nobody has claimed it yet"
            elif ok:
                new, detail = "VERIFIED", "already true at check time - " + detail
            else:
                detail = "still open - " + detail
        elif status == "BLOCKED":
            ok, detail = run_check(v if isinstance(v, dict) else {})
            if ok:
                new, detail = "VERIFIED", "unblocked - " + detail
            else:
                detail = "reported blocked - " + (detail if ok is not None else "no machine check")
        else:
            ok, detail = run_check(v if isinstance(v, dict) else {})
            if ok is None:
                if fm.get("countersigned_by"):
                    new, detail = "VERIFIED", "countersigned by %s" % fm["countersigned_by"]
                else:
                    new = "CLAIMED"
                    detail = "manual-attest, awaiting countersign"
            elif ok:
                new = "VERIFIED"
            else:
                new = "DISPUTED" if status in ("CLAIMED", "VERIFIED") else status

        if new != status and not dry:
            if set_status(path, new, detail):
                changes += 1
                if log:
                    append_log(root, fm.get("id"), status, new, detail)
        rows.append({"id": fm.get("id", "?"), "title": fm.get("title", ""),
                     "project": fm.get("project", ""), "assigned": fm.get("assigned_to", ""),
                     "opened": str(fm.get("opened", "")), "due": str(fm.get("due", "")),
                     "blocks": fm.get("blocks", ""), "status": new, "detail": detail,
                     "file": os.path.basename(path)})
    return rows, changes


def append_log(root, cid, old, new, detail):
    p = os.path.join(root, "checkpoints", "log.jsonl")
    rec = {"ts": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
           "id": cid, "from": old, "to": new, "by": "verify.py", "detail": detail}
    with open(p, "a", encoding="utf-8") as f:
        f.write(json.dumps(rec) + "\n")


def write_index(root, rows, repo_slug):
    rows = sorted(rows, key=lambda r: (ORDER.index(r["status"]) if r["status"] in ORDER else 9, r["id"]))
    today = datetime.date.today()
    n = {k: sum(1 for r in rows if r["status"] == k) for k in MARKER}
    done, total = n["VERIFIED"], max(len(rows) - n["CANCELLED"], 1)
    L = []
    L.append("# Checkpoint index\n")
    L.append("_Generated by `checkpoints/verify.py` on %s — do not edit by hand._\n" % today)
    L.append("**%d of %d verified (%d%%)** · %s %d open · %s %d claimed · %s %d disputed · %s %d blocked\n"
             % (done, total, round(100 * done / total), MARKER["OPEN"], n["OPEN"],
                MARKER["CLAIMED"], n["CLAIMED"], MARKER["DISPUTED"], n["DISPUTED"],
                MARKER["BLOCKED"], n["BLOCKED"]))
    urgent = [r for r in rows if r["status"] in ("DISPUTED", "BLOCKED")]
    if urgent:
        L.append("## Needs attention now\n")
        for r in urgent:
            L.append("- %s **%s** — %s · _%s_" % (MARKER[r["status"]], r["id"], r["title"], r["detail"]))
        L.append("")
    L.append("| | ID | Request | Project | Owner | Age | Last check |")
    L.append("|---|---|---|---|---|---|---|")
    for r in rows:
        try:
            age = "%dd" % (today - datetime.date.fromisoformat(r["opened"])).days
        except Exception:
            age = "—"
        link = "[%s](./%s)" % (r["id"], r["file"])
        L.append("| %s | %s | %s | %s | %s | %s | %s |" % (
            MARKER.get(r["status"], "?"), link, r["title"], r["project"],
            r["assigned"], age, r["detail"]))
    L.append("")
    L.append("Legend: %s open · %s claimed by Charles, unverified · %s verified · "
             "%s claimed but the check failed · %s blocked · %s cancelled\n"
             % (MARKER["OPEN"], MARKER["CLAIMED"], MARKER["VERIFIED"],
                MARKER["DISPUTED"], MARKER["BLOCKED"], MARKER["CANCELLED"]))
    L.append("Protocol: [`docs/CHECKPOINTS.md`](../docs/CHECKPOINTS.md) · "
             "Audit trail: [`log.jsonl`](./log.jsonl)\n")
    open(os.path.join(root, "checkpoints", "INDEX.md"), "w", encoding="utf-8").write("\n".join(L))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--rollup", metavar="DIR", help="directory holding several repo clones")
    ap.add_argument("--repo", default="gershonconsulting/gershonCRM")
    a = ap.parse_args()

    if a.rollup:
        allrows, tot = [], 0
        for name in sorted(os.listdir(a.rollup)):
            root = os.path.join(a.rollup, name)
            if os.path.isdir(os.path.join(root, "checkpoints")):
                rows, ch = verify_repo(root, a.dry_run)
                for r in rows:
                    r["repo"] = name
                allrows += rows
                tot += ch
                if not a.dry_run:
                    write_index(root, rows, name)
        report(allrows)
        print("\n%d status change(s) across %d repo(s)." % (tot, len({r.get('repo') for r in allrows})))
        return

    root = os.path.dirname(HERE)
    rows, ch = verify_repo(root, a.dry_run)
    if not a.dry_run:
        write_index(root, rows, a.repo)
    report(rows)
    print("\n%d status change(s)%s." % (ch, " (dry run — nothing written)" if a.dry_run else ""))


def report(rows):
    if not rows:
        print("No checkpoints found.")
        return
    w = max(len(r["id"]) for r in rows)
    for r in sorted(rows, key=lambda r: ORDER.index(r["status"]) if r["status"] in ORDER else 9):
        print("%s %-*s  %-9s %s" % (MARKER.get(r["status"], "?"), w, r["id"], r["status"], r["detail"]))


if __name__ == "__main__":
    main()
