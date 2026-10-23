#!/usr/bin/env bash
# Build the site and put it on the server: ./deploy.sh [ssh-host]   (default: server)
# The new version goes into a fresh folder and replaces the old one in a single rename, so
# readers never see a half-copied site; the nginx site is installed (or updated) and checked
# with `nginx -t` before nginx reloads.
set -euo pipefail
HOST="${1:-server}"
HERE="$(cd "$(dirname "$0")" && pwd)"
WEB="$HERE/../web"

(cd "$WEB" && npm run build)

STAMP="$(date +%Y%m%d-%H%M%S)"
tar -czf - -C "$WEB/dist" . | ssh "$HOST" "set -e
  sudo mkdir -p /var/www/liuhe.new-$STAMP
  sudo tar -xzf - -C /var/www/liuhe.new-$STAMP
  sudo chmod -R a+rX /var/www/liuhe.new-$STAMP
  if [ -d /var/www/liuhe ]; then sudo mv /var/www/liuhe /var/www/liuhe.old-$STAMP; fi
  sudo mv /var/www/liuhe.new-$STAMP /var/www/liuhe
  # keep only the last previous version, for a quick rollback
  ls -d /var/www/liuhe.old-* 2>/dev/null | sort | head -n -1 | xargs -r sudo rm -rf"

ssh "$HOST" "sudo tee /etc/nginx/sites-available/liuhe >/dev/null" < "$HERE/../deploy/liuhe.nginx.conf"
ssh "$HOST" "set -e
  sudo ln -sf /etc/nginx/sites-available/liuhe /etc/nginx/sites-enabled/liuhe
  sudo nginx -t
  sudo systemctl reload nginx"

echo "deployed to $HOST"
