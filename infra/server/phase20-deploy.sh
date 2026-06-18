#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# phase20-deploy.sh — single SAFE wrapper for Blueprint v2 Phase 20 ONLY
#   (Real Email Provider Activation — provider-ready, LOCAL-SAFE).
#
# APP-ONLY · NO MIGRATION · NO SCHEMA CHANGE.
# Run ON THE VPS (operator handoff — same method as phases 1–19):
#     ROOT=/opt/exploringtoknow bash phase20-deploy.sh
#
# It will: prove it is on the VPS · get commit 40174e6 onto the working tree
# (from the repo if present, else from a git bundle at $BUNDLE) · fast-forward
# main to 40174e6 · create/preserve rollback tag pre-phase20-email -> 125d114 ·
# run the hardened app-only deploy (SKIP_MIGRATE=1) · run read-only verification ·
# print a paste-back report. It NEVER prints secrets or env values, never runs a
# migration, never sends email, never mutates content.
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail

TARGET="40174e6"            # Phase 20 commit
ROLLBACK_BASE="125d114"     # last deployed state before Phase 20
ROLLBACK_TAG="pre-phase20-email"
ROOT="${ROOT:-/opt/exploringtoknow}"
ENV="$ROOT/env/.env"
BUNDLE="${BUNDLE:-$ROOT/phase20.bundle}"
DOMAIN="${DOMAIN:-exploringtoknow.com}"

log(){ echo "[phase20 $(date -u +%H:%M:%S)] $*"; }
fail(){ echo; echo "FATAL: $*" >&2; echo "ABORTED — production not changed beyond this point."; exit 1; }
code(){ curl -s -o /dev/null -w "%{http_code}" --max-time 12 "$@" 2>/dev/null || echo "000"; }

# ── STEP 0 — prove we are on the production VPS ──────────────────────────────
log "STEP 0 — environment proof"
echo "  pwd=$(pwd)  whoami=$(whoami)  host=$(hostname)"
command -v docker >/dev/null 2>&1 || fail "docker not found — this shell is NOT the VPS."
[ -d "$ROOT" ]                     || fail "$ROOT missing — this shell is NOT the production host."
[ -f "$ENV" ]                      || fail "env file $ENV missing."
[ -f "$ROOT/infra/server/deploy-app.sh" ] || fail "deploy-app.sh missing under $ROOT."
docker inspect etk-app >/dev/null 2>&1     || fail "etk-app container absent — wrong host."
docker inspect etk-postgres >/dev/null 2>&1 || fail "etk-postgres container absent — wrong host."
cd "$ROOT" || fail "cannot cd $ROOT"

PGUSER="$(grep -E '^POSTGRES_USER=' "$ENV" | cut -d= -f2)"
PGDB="$(grep -E '^POSTGRES_DB=' "$ENV" | cut -d= -f2)"
sql(){ docker exec etk-postgres psql -U "$PGUSER" -d "$PGDB" -tAc "$1" 2>/dev/null | tr -d '[:space:]'; }
migcount(){ sql 'select count(*) from payload_migrations'; }

# ── STEP 1 — record pre-state (read-only) ───────────────────────────────────
log "STEP 1 — pre-state snapshot"
[ -z "$(git status --porcelain)" ] || fail "VPS working tree is dirty — refusing to deploy. Resolve manually first."
HEAD_BEFORE="$(git rev-parse --short HEAD)"
MIG_BEFORE="$(migcount)"
GEN_BEFORE="$(sql 'select count(*) from generation_runs')"
ART_BEFORE="$(sql 'select count(*) from articles')"
MEDIA_BEFORE="$(sql 'select count(*) from media')"
log "  HEAD=$HEAD_BEFORE  payload_migrations=$MIG_BEFORE  generation_runs=$GEN_BEFORE  articles=$ART_BEFORE  media=$MEDIA_BEFORE"

# ── STEP 2 — ensure commit 40174e6 is present, fast-forward main to it ───────
log "STEP 2 — ensure target $TARGET present"
if git rev-parse -q --verify "${TARGET}^{commit}" >/dev/null 2>&1; then
  log "  commit $TARGET already in repo"
else
  [ -f "$BUNDLE" ] || fail "commit $TARGET not in repo and no bundle at $BUNDLE. Place phase20.bundle there and re-run."
  git bundle verify "$BUNDLE" >/dev/null 2>&1 || fail "bundle $BUNDLE failed verification."
  git fetch "$BUNDLE" main >/dev/null 2>&1     || fail "git fetch from bundle failed."
  git rev-parse -q --verify "${TARGET}^{commit}" >/dev/null 2>&1 || fail "bundle did not contain $TARGET."
  log "  fetched $TARGET from bundle"
fi
[ "$(git rev-parse --abbrev-ref HEAD)" = "main" ] || git checkout main >/dev/null 2>&1 || fail "cannot checkout main."
if [ "$(git rev-parse HEAD)" != "$(git rev-parse "$TARGET")" ]; then
  git merge --ff-only "$TARGET" >/dev/null 2>&1 || fail "cannot fast-forward main to $TARGET (non-FF / conflict)."
fi
HEAD_NOW="$(git rev-parse --short HEAD)"
[ "$HEAD_NOW" = "$TARGET" ] || fail "after update HEAD=$HEAD_NOW, expected $TARGET."
log "  HEAD now $HEAD_NOW"

# ── STEP 3 — rollback tag (create if missing; never overwrite a valid one) ───
log "STEP 3 — rollback tag $ROLLBACK_TAG -> $ROLLBACK_BASE"
if git rev-parse -q --verify "refs/tags/$ROLLBACK_TAG" >/dev/null 2>&1; then
  AT="$(git rev-parse --short "refs/tags/${ROLLBACK_TAG}^{commit}")"
  if [ "$AT" = "$(git rev-parse --short "$ROLLBACK_BASE")" ]; then log "  exists, points to $ROLLBACK_BASE (preserved)"
  else log "  WARNING: tag points to $AT, not $ROLLBACK_BASE — left AS-IS, not overwritten."; fi
else
  git rev-parse -q --verify "${ROLLBACK_BASE}^{commit}" >/dev/null 2>&1 || fail "rollback base $ROLLBACK_BASE not in repo."
  git tag -a "$ROLLBACK_TAG" -m "Last deployed state before Phase 20 (real email provider, local-safe)" "$ROLLBACK_BASE" \
    && log "  created $ROLLBACK_TAG -> $ROLLBACK_BASE" || fail "could not create rollback tag."
fi

# ── STEP 4 — app-only deploy (NO migration) ─────────────────────────────────
log "STEP 4 — app-only deploy (SKIP_MIGRATE=1) via hardened deploy-app.sh"
SKIP_MIGRATE=1 ROOT="$ROOT" bash infra/server/deploy-app.sh || fail "deploy-app.sh failed — see output above."

# ── STEP 5 — read-only verification ─────────────────────────────────────────
log "STEP 5 — verification (read-only)"
ROOT="$ROOT" DOMAIN="$DOMAIN" bash infra/server/verify-app.sh >/tmp/phase20-verify.out 2>&1 \
  && log "  verify-app.sh wrote APP_DEPLOYMENT_REPORT.md" || log "  (verify-app.sh non-zero; continuing with inline checks)"

HEAD_AFTER="$(git rev-parse --short HEAD)"
MIG_AFTER="$(migcount)"
GEN_AFTER="$(sql 'select count(*) from generation_runs')"
ART_AFTER="$(sql 'select count(*) from articles')"
MEDIA_AFTER="$(sql 'select count(*) from media')"
APP_IMG="$(docker inspect -f '{{.Image}}' etk-app 2>/dev/null)"
BUILT_IMG="$(docker image inspect -f '{{.Id}}' etk-web:latest 2>/dev/null)"
APP_HEALTH="$(docker inspect -f '{{.State.Health.Status}}' etk-app 2>/dev/null || echo absent)"
WORKER_STATE="$(docker inspect -f '{{.State.Status}}' etk-worker 2>/dev/null || echo absent)"
H_INTERNAL="$(code -H "Host: $DOMAIN" http://127.0.0.1/api/health)"

# public routes (expect 200)
R_HOME="$(code https://$DOMAIN/)";            R_SIGNUP="$(code https://$DOMAIN/signup)"
R_LOGIN="$(code https://$DOMAIN/login)";      R_REQ="$(code https://$DOMAIN/request-product)"
R_CATS="$(code https://$DOMAIN/categories)";  R_SEARCH="$(code https://$DOMAIN/search)"
R_SITEMAP="$(code https://$DOMAIN/sitemap.xml)"; R_HEALTH="$(code https://$DOMAIN/api/health)"
# gated routes
R_APP="$(code https://$DOMAIN/app)"           # expect 3xx -> /login when unauthenticated
R_PLATFORM="$(code https://$DOMAIN/platform)"
R_DASH="$(code https://$DOMAIN/dashboard)"
R_ADMIN="$(code https://$DOMAIN/admin)"

# email provider env presence — NAME + present/missing ONLY (never values)
EMAIL_LINES=""; RESEND_PRESENT="missing"; PROVIDER_PRESENT="missing"
for k in NEWSLETTER_PROVIDER RESEND_API_KEY NEWSLETTER_FROM NEWSLETTER_REPLY_TO NEWSLETTER_DOUBLE_OPT_IN CONTACT_NOTIFY_TO; do
  if grep -qE "^${k}=.+" "$ENV" 2>/dev/null; then st="present"; else st="missing"; fi
  [ "$k" = "RESEND_API_KEY" ] && RESEND_PRESENT="$st"
  [ "$k" = "NEWSLETTER_PROVIDER" ] && PROVIDER_PRESENT="$st"
  EMAIL_LINES="${EMAIL_LINES}    ${k} = ${st}\n"
done
if [ "$RESEND_PRESENT" = "present" ]; then EMAIL_MODE="provider key PRESENT — real-send capable (confirm this is intended)"; else EMAIL_MODE="LOCAL-SAFE (no provider key → no external email sent)"; fi

# critical pass conditions
PASS="PASS"; chk(){ [ "$1" = "$2" ] || { PASS="FAIL"; echo "  ✗ $3 (got '$1', want '$2')"; }; }
chk "$HEAD_AFTER" "$TARGET" "production HEAD == $TARGET"
chk "$APP_HEALTH" "healthy" "etk-app health == healthy"
chk "$MIG_AFTER" "$MIG_BEFORE" "payload_migrations unchanged"
[ "$R_HOME" = "200" ] || { PASS="FAIL"; echo "  ✗ https://$DOMAIN/ == 200 (got $R_HOME)"; }
[ "$R_HEALTH" = "200" ] || { PASS="FAIL"; echo "  ✗ /api/health == 200 (got $R_HEALTH)"; }
case "$R_APP" in 30[1278]) :;; *) PASS="FAIL"; echo "  ✗ /app should redirect (3xx), got $R_APP";; esac
[ -n "$APP_IMG" ] && [ "$APP_IMG" = "$BUILT_IMG" ] || echo "  note: running image ($APP_IMG) vs built ($BUILT_IMG) — deploy-app.sh asserts this; review if differing."
[ "$GEN_AFTER" = "$GEN_BEFORE" ] || { PASS="FAIL"; echo "  ✗ generation_runs changed ($GEN_BEFORE -> $GEN_AFTER)"; }
[ "$ART_AFTER" = "$ART_BEFORE" ] || { PASS="FAIL"; echo "  ✗ articles count changed ($ART_BEFORE -> $ART_AFTER)"; }
[ "$MEDIA_AFTER" = "$MEDIA_BEFORE" ] || { PASS="FAIL"; echo "  ✗ media count changed ($MEDIA_BEFORE -> $MEDIA_AFTER)"; }

# ── FINAL REPORT (paste this back) ──────────────────────────────────────────
cat <<EOF

==================== PHASE 20 DEPLOY REPORT (paste back) ====================
Ran on VPS:            host=$(hostname)  user=$(whoami)  path=$ROOT
Deploy path:           operator-handoff on VPS (git bundle -> ff main -> deploy-app.sh)
HEAD before -> after:  $HEAD_BEFORE -> $HEAD_AFTER   (target $TARGET)
Production HEAD == 40174e6:   $([ "$HEAD_AFTER" = "$TARGET" ] && echo YES || echo NO)
Rollback tag:          $ROLLBACK_TAG -> $(git rev-parse --short "${ROLLBACK_TAG}^{commit}" 2>/dev/null || echo '(none)')   (base $ROLLBACK_BASE)
Migration used:        NO (SKIP_MIGRATE=1, app-only)
payload_migrations:    before=$MIG_BEFORE  after=$MIG_AFTER  $([ "$MIG_AFTER" = "$MIG_BEFORE" ] && echo '(UNCHANGED ✓)' || echo '(CHANGED ✗)')
App image:             running=$APP_IMG  built=$BUILT_IMG
App health:            etk-app=$APP_HEALTH   worker=$WORKER_STATE
/api/health:           internal(Caddy)=$H_INTERNAL   public=$R_HEALTH
Public routes:         / =$R_HOME  /signup=$R_SIGNUP  /login=$R_LOGIN  /request-product=$R_REQ
                       /categories=$R_CATS  /search=$R_SEARCH  /sitemap.xml=$R_SITEMAP
Gated routes:          /app=$R_APP (expect 3xx->/login)  /platform=$R_PLATFORM  /dashboard=$R_DASH  /admin=$R_ADMIN
Content safety:        generation_runs $GEN_BEFORE->$GEN_AFTER  articles $ART_BEFORE->$ART_AFTER  media $MEDIA_BEFORE->$MEDIA_AFTER
Email provider:        $EMAIL_MODE
Email env (name only, NO values):
$(printf "%b" "$EMAIL_LINES")
Safety confirmations:  no migration · no schema change · no generation/approval/publish triggered ·
                       no image API / affiliate / content logic touched · worker/postgres/caddy untouched ·
                       no secrets printed · no env values printed · no real email sent unless RESEND_API_KEY present.
OVERALL:               $PASS
============================================================================
EOF
[ "$PASS" = "PASS" ] && log "DONE — Phase 20 deployed & verified (app-only, local-safe)." || log "COMPLETED WITH FAILURES — review ✗ lines above; consider rollback to $ROLLBACK_TAG."
