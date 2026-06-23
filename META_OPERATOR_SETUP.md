# META_OPERATOR_SETUP.md — Phase 32 Meta Ads go-live checklist (operator)

_Created 2026-06-23. The Phase 32 code foundation is **deployed and env-gated**: with no `META_*` values set, the Meta Ads
provider shows **"platform setup pending"** and makes **no OAuth call and no API call**. This checklist is what **you (the
platform operator)** create in Meta's developer tools and place on the VPS to turn Meta on — in the **correct multi-tenant
SaaS model**. You do NOT paste any secret into chat, and nothing here is committed to git._

> **Model (same as Google Ads):** ExploringToKnow owns **ONE** Meta app (App ID + App Secret), stored in **env only**.
> Each customer/workspace owner then connects **their OWN** Meta ad account via OAuth from inside the app; their token is
> encrypted per-workspace. Customers never create a Meta app and never provide API credentials. There is **no single global
> Meta account** that everyone shares.

---

## A. What you create in Meta (browser only — do not paste values into chat)

1. **Meta for Developers account** — sign in at https://developers.facebook.com/ with the Business/Facebook account that
   should own the platform app. (A **Meta Business** account / Business Manager is recommended; you'll need it for App Review
   and Business Verification later.)
2. **Create an App** → type **"Business"**. Name it (e.g., "ExploringToKnow"). This yields an **App ID** and **App Secret**
   (App Secret is under *App settings → Basic*). These are the platform credentials — treat the App Secret like a password.
3. **Add the "Marketing API" product** to the app (left nav → *Add product*). This is what exposes Ads Insights / ad accounts.
4. **Configure Facebook Login** (or "Facebook Login for Business") product → **Settings**:
   - Add the **Valid OAuth Redirect URI** exactly:
     `https://exploringtoknow.com/api/app/provider-connections/oauth/meta_ads/callback`
   - Ensure **Client OAuth Login** and **Web OAuth Login** are enabled.
5. **Permission you need:** `ads_read` (read-only Ads Insights). You do **not** need `ads_management` for this read-only phase.
6. **App Mode / access:**
   - While the app is in **Development mode** or before App Review, `ads_read` works for **app roles/test users only**
     (people added under *App roles → Roles/Testers*). That's enough to **validate the live loop** with your own account if
     it's an admin/developer/tester of the app.
   - To connect **real customer ad accounts** (arbitrary users), the app must request **Advanced Access** for `ads_read` via
     **App Review**, and complete **Business Verification**. (This is the Meta equivalent of Google's "Basic Access".)

> You can complete steps A1–A6 and validate with a **test/admin user** immediately — App Review is only required to open it
> to outside customers. This mirrors how Google was validated on a test path while Basic Access is pending.

---

## B. Place the credentials on the VPS (you run these; values never appear in chat)

SSH to the server and append the four values to the env file (root-owned, `600`). Use `! ` in this session if you want them
run here without exposing values, or do it yourself:

```bash
sudo tee -a /opt/exploringtoknow/env/.env >/dev/null <<'ENV'
META_APP_ID=<your app id>
META_APP_SECRET=<your app secret>
META_REDIRECT_URI=https://exploringtoknow.com/api/app/provider-connections/oauth/meta_ads/callback
META_API_VERSION=v25.0
ENV
```

`PROVIDER_TOKEN_ENCRYPTION_KEY` is already set (it powers the existing Google vault) — Meta reuses it. `META_API_VERSION`
is optional; omit it to default to `v25.0`.

Then recreate the app container so it reads the new env (no rebuild needed, no migration):

```bash
cd /opt/exploringtoknow/compose && sudo docker compose --env-file /opt/exploringtoknow/env/.env --profile app up -d --no-deps --force-recreate app
```

---

## C. Tell me when done — I verify (read-only, presence by name only)

After you've placed the values and recreated the app, tell me. I will (without printing any value):
1. Confirm `META_APP_ID` / `META_APP_SECRET` / `META_REDIRECT_URI` / `META_API_VERSION` are **PRESENT** (names only).
2. Confirm the Meta provider page flips from "setup pending" → **"Ready — configured by ExploringToKnow"** and the **Connect
   Meta Ads** button appears for owners/admins.
3. Then a workspace owner clicks **Connect Meta Ads** → authorizes on Meta (read-only `ads_read`) → returns connected →
   **Discover accounts** → pick an ad account → **Sync last 30 days**. I confirm `api_synced` rows land in
   `synced_performance_daily` for `provider=meta_ads`, scoped to that workspace.

If discovery returns 0 accounts or an error, I'll read the **sanitized** `lastErrorMessage` (Graph type/code/subcode — never
the token) and tell you the exact cause (e.g., the login has no ad accounts, or `ads_read` isn't approved for outside users
yet → App Review/Advanced Access needed).

---

## D. Guardrails (unchanged from Google)

- **Read-only.** Phase 32 calls only `me/adaccounts` and `act_{id}/insights`. No campaign/ad/budget create or edit. Scope is
  `ads_read` only.
- **Per-workspace, tenant-isolated.** Each workspace stores its own encrypted token; never shared or shown. Owner/admin/super
  connect; viewer/editor are read-only; cross-tenant access is blocked.
- **No secrets in git or chat.** Credentials live only in `/opt/exploringtoknow/env/.env`.
- **Google Ads is untouched** by all of this and remains connected, awaiting Basic Access approval.
