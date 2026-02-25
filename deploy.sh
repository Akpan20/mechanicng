#!/usr/bin/env bash
# =============================================================================
# MechanicNG Full Deployment Script
# Express backend + Vite/React frontend + MongoDB Atlas
# Target: Ubuntu 22.04 LTS VPS (DigitalOcean / Hetzner / AWS EC2)
# Usage:  sudo bash deploy.sh
# =============================================================================

set -euo pipefail
IFS=$'\n\t'

# ─── Colours ─────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; RESET='\033[0m'

log()     { echo -e "${GREEN}[✓]${RESET} $*"; }
info()    { echo -e "${BLUE}[…]${RESET} $*"; }
warn()    { echo -e "${YELLOW}[!]${RESET} $*"; }
error()   { echo -e "${RED}[✗]${RESET} $*"; exit 1; }
section() { echo -e "\n${BOLD}${BLUE}══ $* ══${RESET}\n"; }

# ─── Configuration — edit these before running ───────────────────────────────
DOMAIN="${DOMAIN:-mechanicng.com}"           # Your domain (or server IP for testing)
APP_USER="${APP_USER:-mechanicng}"           # System user that runs the app
REPO_URL="${REPO_URL:-}"                     # Git repo URL (leave empty to skip clone)
DEPLOY_DIR="/var/www/mechanicng"             # Root deploy directory
BACKEND_DIR="$DEPLOY_DIR/backend"
FRONTEND_DIR="$DEPLOY_DIR/frontend"
NODE_VERSION="20"                            # Node.js LTS version

# ─── Sanity checks ───────────────────────────────────────────────────────────
section "Pre-flight checks"

[[ $EUID -eq 0 ]] || error "Run as root: sudo bash deploy.sh"
[[ $(lsb_release -si 2>/dev/null) == "Ubuntu" ]] || warn "This script targets Ubuntu — proceed with caution on other distros"

log "Running on: $(lsb_release -sd 2>/dev/null || uname -sr)"

# ─── 1. System packages ──────────────────────────────────────────────────────
section "1. Installing system packages"

apt-get update -qq
apt-get install -y -qq \
  curl wget git build-essential \
  nginx certbot python3-certbot-nginx \
  ufw fail2ban \
  > /dev/null

log "System packages installed"

# ─── 2. Node.js via nvm (per-user) or NodeSource (system) ────────────────────
section "2. Installing Node.js $NODE_VERSION"

if ! command -v node &>/dev/null || [[ $(node -v | cut -d. -f1 | tr -d v) -lt $NODE_VERSION ]]; then
  info "Installing Node.js $NODE_VERSION via NodeSource..."
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash - > /dev/null
  apt-get install -y -qq nodejs > /dev/null
fi

NODE_V=$(node -v)
NPM_V=$(npm -v)
log "Node $NODE_V / npm $NPM_V"

# ─── 3. PM2 ──────────────────────────────────────────────────────────────────
section "3. Installing PM2"

if ! command -v pm2 &>/dev/null; then
  npm install -g pm2 > /dev/null
fi
log "PM2 $(pm2 -v)"

# ─── 4. App user ─────────────────────────────────────────────────────────────
section "4. Creating app user: $APP_USER"

if ! id "$APP_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$APP_USER"
  log "Created user $APP_USER"
else
  log "User $APP_USER already exists"
fi

# ─── 5. Deploy directory & code ──────────────────────────────────────────────
section "5. Setting up deploy directory"

mkdir -p "$BACKEND_DIR" "$FRONTEND_DIR"

if [[ -n "$REPO_URL" ]]; then
  info "Cloning repository from $REPO_URL..."
  if [[ -d "$DEPLOY_DIR/.git" ]]; then
    git -C "$DEPLOY_DIR" pull
  else
    git clone "$REPO_URL" "$DEPLOY_DIR"
  fi
  log "Repository cloned/updated"
else
  warn "REPO_URL not set — skipping git clone."
  warn "Manually copy your code to:"
  warn "  Backend:  $BACKEND_DIR"
  warn "  Frontend: $FRONTEND_DIR"
  warn "Then re-run this script or continue manually."
fi

chown -R "$APP_USER:$APP_USER" "$DEPLOY_DIR"

# ─── 6. Backend environment file ─────────────────────────────────────────────
section "6. Backend environment"

BACKEND_ENV="$BACKEND_DIR/.env"

if [[ ! -f "$BACKEND_ENV" ]]; then
  info "Creating backend .env from template..."
  cat > "$BACKEND_ENV" << 'ENVEOF'
# ── Server ────────────────────────────────────────────────────
NODE_ENV=production
PORT=4000

# ── MongoDB Atlas ─────────────────────────────────────────────
# Get this from: Atlas → Connect → Drivers → Node.js
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/mechanicng?retryWrites=true&w=majority

# ── JWT ───────────────────────────────────────────────────────
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=CHANGE_THIS_TO_A_RANDOM_64_CHAR_HEX_STRING
JWT_EXPIRES_IN=7d

# ── CORS ──────────────────────────────────────────────────────
# Your frontend domain (no trailing slash)
CLIENT_URL=https://YOURDOMAIN.com

# ── Admin ─────────────────────────────────────────────────────
ADMIN_SECRET=CHANGE_THIS_TO_A_SECURE_RANDOM_STRING

# ── Paystack ──────────────────────────────────────────────────
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxx

# ── Cloudinary (photo uploads) ────────────────────────────────
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ── Email (Resend / SMTP) ─────────────────────────────────────
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_xxxxxxxxxxxxxxxxxxxx
SMTP_FROM=noreply@YOURDOMAIN.com
ENVEOF

  chown "$APP_USER:$APP_USER" "$BACKEND_ENV"
  chmod 600 "$BACKEND_ENV"

  warn "╔══════════════════════════════════════════════════╗"
  warn "║  IMPORTANT: Edit $BACKEND_ENV    ║"
  warn "║  Fill in MONGODB_URI, JWT_SECRET, etc.           ║"
  warn "║  Then re-run:  sudo bash deploy.sh               ║"
  warn "╚══════════════════════════════════════════════════╝"
  exit 0
fi

log "Backend .env exists"

# Validate critical env vars
source "$BACKEND_ENV"
[[ "$MONGODB_URI" == *"<user>"* ]] && error "MONGODB_URI still has placeholder values. Edit $BACKEND_ENV first."
[[ "$JWT_SECRET" == "CHANGE_THIS"* ]] && error "JWT_SECRET is not set. Edit $BACKEND_ENV first."
[[ "$CLIENT_URL" == *"YOURDOMAIN"* ]] && error "CLIENT_URL still has placeholder. Edit $BACKEND_ENV first."

log "Environment variables validated"

# ─── 7. Build backend ────────────────────────────────────────────────────────
section "7. Building backend (TypeScript → JS)"

cd "$BACKEND_DIR"
info "Installing backend dependencies..."
sudo -u "$APP_USER" npm ci --silent

info "Compiling TypeScript..."
sudo -u "$APP_USER" npm run build

log "Backend built → $BACKEND_DIR/dist/"

# ─── 8. Build frontend ───────────────────────────────────────────────────────
section "8. Building frontend (Vite)"

cd "$FRONTEND_DIR"

# Frontend env
FRONTEND_ENV="$FRONTEND_DIR/.env.production"
if [[ ! -f "$FRONTEND_ENV" ]]; then
  cat > "$FRONTEND_ENV" << FRONTENVEOF
VITE_API_URL=https://${DOMAIN}
FRONTENVEOF
  chown "$APP_USER:$APP_USER" "$FRONTEND_ENV"
  log "Created $FRONTEND_ENV"
fi

info "Installing frontend dependencies..."
sudo -u "$APP_USER" npm ci --silent

info "Building Vite app..."
sudo -u "$APP_USER" npm run build

log "Frontend built → $FRONTEND_DIR/dist/"

# ─── 9. PM2 ecosystem file ───────────────────────────────────────────────────
section "9. Configuring PM2"

cat > "$DEPLOY_DIR/ecosystem.config.js" << ECOSYSEOF
module.exports = {
  apps: [
    {
      name: 'mechanicng-api',
      script: 'dist/index.js',
      cwd: '${BACKEND_DIR}',
      instances: 'max',          // one per CPU core
      exec_mode: 'cluster',
      env_file: '${BACKEND_ENV}',
      env: {
        NODE_ENV: 'production',
      },
      // Logging
      out_file: '/var/log/mechanicng/api-out.log',
      error_file: '/var/log/mechanicng/api-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Reliability
      max_memory_restart: '512M',
      restart_delay: 3000,
      max_restarts: 10,
      watch: false,
    },
  ],
}
ECOSYSEOF

mkdir -p /var/log/mechanicng
chown -R "$APP_USER:$APP_USER" /var/log/mechanicng

# Start / reload PM2
if pm2 list | grep -q "mechanicng-api"; then
  info "Reloading existing PM2 process..."
  pm2 reload "$DEPLOY_DIR/ecosystem.config.js" --update-env
else
  info "Starting PM2 process..."
  pm2 start "$DEPLOY_DIR/ecosystem.config.js"
fi

# Save PM2 process list and enable on boot
pm2 save
pm2 startup systemd -u root --hp /root > /dev/null 2>&1 || true
systemctl enable pm2-root 2>/dev/null || true

log "PM2 configured and running"

# ─── 10. Nginx ───────────────────────────────────────────────────────────────
section "10. Configuring Nginx"

NGINX_CONF="/etc/nginx/sites-available/mechanicng"

cat > "$NGINX_CONF" << NGINXEOF
# MechanicNG — generated by deploy.sh
# HTTP → HTTPS redirect (certbot will enhance this)

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    # SSL — certbot will update these paths
    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN"        always;
    add_header X-Content-Type-Options "nosniff"    always;
    add_header X-XSS-Protection "1; mode=block"    always;
    add_header Referrer-Policy "strict-origin"     always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml image/svg+xml;
    gzip_vary on;

    # ── API ──────────────────────────────────────────────────
    location /api/ {
        proxy_pass         http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade          \$http_upgrade;
        proxy_set_header   Connection       'upgrade';
        proxy_set_header   Host             \$host;
        proxy_set_header   X-Real-IP        \$remote_addr;
        proxy_set_header   X-Forwarded-For  \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout    60s;
        proxy_read_timeout    60s;

        # Body size (for photo uploads)
        client_max_body_size 10M;
    }

    # ── Frontend (Vite SPA) ──────────────────────────────────
    root ${FRONTEND_DIR}/dist;
    index index.html;

    # Cache static assets aggressively (Vite fingerprints them)
    location ~* \.(js|css|woff2?|ttf|eot|ico|svg|png|jpg|jpeg|gif|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    # HTML — no cache (always fresh for SPA routing)
    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
NGINXEOF

# Enable site
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/mechanicng
rm -f /etc/nginx/sites-enabled/default

# Test config
nginx -t || error "Nginx config test failed. Check $NGINX_CONF"

log "Nginx configured"

# ─── 11. SSL with Let's Encrypt ──────────────────────────────────────────────
section "11. SSL certificate"

mkdir -p /var/www/certbot

# Check if cert already exists
if [[ -d "/etc/letsencrypt/live/$DOMAIN" ]]; then
  log "SSL certificate already exists for $DOMAIN"
  certbot renew --dry-run --quiet || warn "Cert renewal dry-run failed — check certbot logs"
else
  # Check domain resolves to this server (skip for IP-based deploys)
  SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "unknown")
  DOMAIN_IP=$(dig +short "$DOMAIN" 2>/dev/null | tail -1 || echo "")

  if [[ "$SERVER_IP" == "$DOMAIN_IP" ]]; then
    info "Obtaining SSL certificate for $DOMAIN..."
    EMAIL="${SSL_EMAIL:-admin@${DOMAIN}}"

    # Temporarily serve on HTTP for ACME challenge
    cat > /etc/nginx/sites-available/mechanicng-temp << TEMPEOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 200 'ok'; }
}
TEMPEOF
    ln -sf /etc/nginx/sites-available/mechanicng-temp /etc/nginx/sites-enabled/mechanicng
    nginx -s reload 2>/dev/null || systemctl reload nginx

    certbot certonly \
      --webroot -w /var/www/certbot \
      --email "$EMAIL" \
      --agree-tos \
      --no-eff-email \
      --domains "${DOMAIN},www.${DOMAIN}" \
      --non-interactive

    # Restore full config
    ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/mechanicng
    rm -f /etc/nginx/sites-available/mechanicng-temp
    log "SSL certificate obtained"
  else
    warn "Domain $DOMAIN does not point to this server ($SERVER_IP)."
    warn "Skipping SSL. Nginx will serve HTTP only for now."
    warn "Once DNS is set, run: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"

    # Rewrite nginx config to HTTP only temporarily
    cat > "$NGINX_CONF" << HTTPNGINXEOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN} _;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    location /api/ {
        proxy_pass         http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header   Host             \$host;
        proxy_set_header   X-Real-IP        \$remote_addr;
        proxy_set_header   X-Forwarded-For  \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        client_max_body_size 10M;
    }

    root ${FRONTEND_DIR}/dist;
    index index.html;

    location ~* \.(js|css|woff2?|ttf|ico|svg|png|jpg|jpeg|gif|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
HTTPNGINXEOF
  fi
fi

# Auto-renew cron
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
  (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
  log "SSL auto-renewal cron installed"
fi

# ─── 12. Firewall ────────────────────────────────────────────────────────────
section "12. Firewall (UFW)"

ufw --force reset > /dev/null
ufw default deny incoming > /dev/null
ufw default allow outgoing > /dev/null
ufw allow ssh   comment 'SSH'   > /dev/null
ufw allow http  comment 'HTTP'  > /dev/null
ufw allow https comment 'HTTPS' > /dev/null
# Port 4000 NOT opened to public — Nginx proxies it internally
ufw --force enable > /dev/null

log "Firewall: SSH + HTTP + HTTPS allowed; port 4000 internal only"

# ─── 13. Fail2ban ────────────────────────────────────────────────────────────
section "13. Fail2ban (brute-force protection)"

cat > /etc/fail2ban/jail.local << 'F2BEOF'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled  = true
filter   = nginx-limit-req
logpath  = /var/log/nginx/error.log
maxretry = 10
F2BEOF

systemctl enable fail2ban --quiet
systemctl restart fail2ban

log "Fail2ban configured"

# ─── 14. Start Nginx ─────────────────────────────────────────────────────────
section "14. Starting Nginx"

nginx -t && systemctl reload nginx || systemctl restart nginx
systemctl enable nginx --quiet

log "Nginx running"

# ─── 15. Create admin account ────────────────────────────────────────────────
section "15. Admin account setup"

ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"

if [[ -n "$ADMIN_EMAIL" && -n "$ADMIN_PASSWORD" ]]; then
  info "Creating admin account: $ADMIN_EMAIL"
  cd "$BACKEND_DIR"
  sudo -u "$APP_USER" \
    ADMIN_EMAIL="$ADMIN_EMAIL" \
    ADMIN_PASSWORD="$ADMIN_PASSWORD" \
    ADMIN_FULLNAME="${ADMIN_FULLNAME:-Site Admin}" \
    node -e "
      require('dotenv').config({ path: '${BACKEND_ENV}' });
      // Run the compiled createAdmin script
      require('./dist/scripts/createAdmin.js');
    " 2>/dev/null || \
    warn "Admin creation failed (may already exist). Run manually if needed."
else
  warn "ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin creation."
  warn "Run manually after deploy:"
  warn "  cd $BACKEND_DIR"
  warn "  npx tsx scripts/createAdmin.ts admin@example.com yourpassword 'Admin Name'"
fi

# ─── 16. Health check ────────────────────────────────────────────────────────
section "16. Health check"

sleep 2  # let PM2 settle

API_URL="http://127.0.0.1:4000/api/health"
RESPONSE=$(curl -sf "$API_URL" 2>/dev/null || echo "FAILED")

if echo "$RESPONSE" | grep -q '"ok":true'; then
  log "API health check passed ✓"
else
  warn "API health check returned: $RESPONSE"
  warn "Check logs: pm2 logs mechanicng-api"
fi

# ─── 17. Summary ─────────────────────────────────────────────────────────────
section "🎉 Deployment complete"

SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

echo -e "
${BOLD}MechanicNG is deployed!${RESET}

${BOLD}URLs:${RESET}
  Frontend:  https://${DOMAIN}   (or http://${SERVER_IP} if DNS not set)
  API:       https://${DOMAIN}/api/health

${BOLD}Useful commands:${RESET}
  pm2 status                         — check app status
  pm2 logs mechanicng-api            — tail logs
  pm2 reload ecosystem.config.js     — zero-downtime reload
  pm2 monit                          — real-time dashboard

  sudo systemctl status nginx        — nginx status
  sudo nginx -t                      — test nginx config
  sudo certbot renew                 — renew SSL cert

${BOLD}Redeploy (after git pull):${RESET}
  sudo bash ${DEPLOY_DIR}/deploy.sh

${BOLD}Create admin (if not done):${RESET}
  cd $BACKEND_DIR
  npx tsx scripts/createAdmin.ts admin@${DOMAIN} 'password' 'Admin'

${BOLD}Log files:${RESET}
  /var/log/mechanicng/api-out.log
  /var/log/mechanicng/api-err.log
  /var/log/nginx/access.log
  /var/log/nginx/error.log
"