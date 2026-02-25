#!/usr/bin/env bash
# =============================================================================
# MechanicNG Redeploy Script
# Run this after git pull to rebuild and reload without downtime
# Usage: sudo bash redeploy.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'; BOLD='\033[1m'; RESET='\033[0m'
log()     { echo -e "${GREEN}[✓]${RESET} $*"; }
info()    { echo -e "${BLUE}[…]${RESET} $*"; }
error()   { echo -e "${RED}[✗]${RESET} $*"; exit 1; }
section() { echo -e "\n${BOLD}${BLUE}══ $* ══${RESET}\n"; }

DEPLOY_DIR="/var/www/mechanicng"
BACKEND_DIR="$DEPLOY_DIR/backend"
FRONTEND_DIR="$DEPLOY_DIR/frontend"
APP_USER="mechanicng"

[[ $EUID -eq 0 ]] || error "Run as root: sudo bash redeploy.sh"
[[ -d "$DEPLOY_DIR" ]] || error "Deploy directory $DEPLOY_DIR not found. Run deploy.sh first."

# ─── Pull latest code ────────────────────────────────────────────────────────
section "1. Pulling latest code"
if [[ -d "$DEPLOY_DIR/.git" ]]; then
  git -C "$DEPLOY_DIR" pull
  log "Code updated"
else
  log "No git repo — skipping pull (copy code manually if needed)"
fi

# ─── Rebuild backend ─────────────────────────────────────────────────────────
section "2. Rebuilding backend"
cd "$BACKEND_DIR"
sudo -u "$APP_USER" npm ci --silent
sudo -u "$APP_USER" npm run build
log "Backend rebuilt"

# ─── Rebuild frontend ────────────────────────────────────────────────────────
section "3. Rebuilding frontend"
cd "$FRONTEND_DIR"
sudo -u "$APP_USER" npm ci --silent
sudo -u "$APP_USER" npm run build
log "Frontend rebuilt"

# ─── Zero-downtime reload ────────────────────────────────────────────────────
section "4. Reloading services"
pm2 reload "$DEPLOY_DIR/ecosystem.config.js" --update-env
nginx -t && systemctl reload nginx
log "PM2 reloaded, Nginx reloaded"

# ─── Health check ────────────────────────────────────────────────────────────
section "5. Health check"
sleep 2
RESPONSE=$(curl -sf "http://127.0.0.1:4000/api/health" 2>/dev/null || echo "FAILED")
if echo "$RESPONSE" | grep -q '"ok":true'; then
  log "API healthy ✓"
else
  echo "Health check failed: $RESPONSE"
  echo "Check: pm2 logs mechanicng-api"
fi

log "Redeploy complete"