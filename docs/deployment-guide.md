# Deployment Guide — Smart CRM L5 Part Inventory (v1.0)

This guide starts the whole system (PostgreSQL + API + web UI, with sample data) on any machine that has Docker. Follow the steps in order; no other setup is needed.

| Item | Value |
|---|---|
| Repository | https://github.com/chinguyen-mr/smartcrm-2374802010056-part-inventory (tag `v1.0`) |
| Track / business flow | SE — L5 Spare-part inventory (stock lookup and alerts, goods receipt, goods issue against a warranty ticket) |
| Services | `postgres` (PostgreSQL 16), `db-init` (one-shot schema + seed job), `backend` (Node.js 20 / Express 5), `frontend` (React 19 build served by Nginx) |

---

## 1. Requirements

| Requirement | Version tested | Check with |
|---|---|---|
| Docker Engine / Docker Desktop with Compose v2 | Docker 29.9, Compose v5.6 (any Compose ≥ 2.20 works) | `docker --version` and `docker compose version` |
| Git | any recent version | `git --version` |
| Free host ports | `3000` (API) and `8088` (web UI) | change them in `.env` if they are taken (see section 3) |
| Disk / RAM | ~1 GB of images, ~1 GB RAM while running | — |
| Internet access on first run | needed to pull `postgres:16-alpine`, `node:20-alpine`, `nginx:1.27-alpine` and npm packages | — |

Node.js and PostgreSQL do **not** need to be installed on the host; everything runs in containers. PostgreSQL is not published to the host, so a local PostgreSQL already using port 5432 does not conflict.

---

## 2. Setup steps

Run these commands in an **empty directory**. Only steps 2.2 and 2.3 start the system; step 2.1 just downloads the code.

### 2.1 Get the code (tag v1.0)

```bash
git clone --branch v1.0 https://github.com/chinguyen-mr/smartcrm-2374802010056-part-inventory.git
cd smartcrm-2374802010056-part-inventory
```

### 2.2 Create the environment file

```bash
cp .env.example .env              # Windows PowerShell: Copy-Item .env.example .env
```

The sample values work as-is on a local machine. Section 3 explains each variable.

### 2.3 Build and start everything

```bash
docker compose up -d --build
```

What happens (first run takes about 1–3 minutes, mostly image downloads):

1. `postgres` starts and becomes **healthy** (`pg_isready`).
2. `db-init` runs once: it creates the 7 tables from `sql/sql-ddl.sql` if they do not exist, loads the sample data, prints the row count of every table and exits with code `0`.
3. `backend` starts only after `db-init` succeeded and becomes **healthy** (`GET /api/health`).
4. `frontend` starts only after `backend` is healthy and becomes **healthy**.

Open the web UI at **http://localhost:8088** (API: **http://localhost:3000**).

### 2.4 Stop / reset

```bash
docker compose down        # stop, keep the data
docker compose down -v     # stop and DELETE the database volume (next "up" re-creates and re-seeds it)
```

---

## 3. Environment variables

All variables live in `.env` (copied from `.env.example`). `.env` is git-ignored and must never be committed.

| Variable | Required | Sample value (`.env.example`) | Used by | Meaning |
|---|---|---|---|---|
| `DB_NAME` | no | `smart_crm` | postgres, db-init, backend | Database name. |
| `DB_USER` | no | `postgres` | postgres, db-init, backend | Database user. |
| `DB_PASSWORD` | **yes** | `change_me_local_db_password` | postgres, db-init, backend | Database password. Compose refuses to start if it is missing. Applied only when the volume is first created — after changing it run `docker compose down -v`. |
| `DB_HOST`, `DB_PORT` | no | `localhost`, `5432` | native run only | Ignored under Docker (the backend always connects to the `postgres` service). |
| `JWT_SECRET` | **yes** | `change-me-please-use-a-random-32-plus-character-secret` | backend | HMAC-SHA256 key for signing tokens. Must be **≥ 32 characters**, otherwise the backend exits at start-up. Generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `JWT_EXPIRES_IN` | no | `1h` | backend | Access-token lifetime. |
| `CORS_ORIGINS` | no | `http://localhost:8088,http://localhost:5173` | backend | Comma-separated browser origins allowed to call the API cross-origin. |
| `TRUST_PROXY` | no | `0` | backend | Set to `1` only behind a TLS-terminating reverse proxy (see section 6). |
| `APP_PORT` | no | `3000` | compose | Host port for the API. |
| `WEB_PORT` | no | `8088` | compose | Host port for the web UI. If you change it, add the new origin to `CORS_ORIGINS`. |
| `VITE_API_URL` | no | *(empty)* | frontend (native dev only) | Leave empty; the UI calls `/api` on its own origin. |

Changing a variable: edit `.env`, then run `docker compose up -d` again.

---

## 4. Sample data

The sample data is loaded automatically by the `db-init` service from `data/sample/*.csv` (the Mekong Mobile case-study dataset; it contains no real customer data).

| Table | Rows after first start |
|---|---|
| `service_center` | 6 |
| `employee` | 38 |
| `part` | 180 |
| `part_stock` | 717 |
| `ticket_ref` | 7,805 (7,800 historical + 5 test tickets) |
| `ticket_part` | 4,063 |
| `part_transaction` | 4,954 (891 receipts `NHAP`, 4,063 issues `XUAT`) |

Test fixtures you can use in the UI or API (center `TT01`, `center_id = 1`):

| Ticket code | Status | Expected behaviour when issuing parts |
|---|---|---|
| `BH-TEST-ACTIVE-01` / `-02` / `-03` | `DANG_XU_LY` / `CHO_LINH_KIEN` / `DA_PHAN_CONG` | issue allowed |
| `BH-TEST-INVALID-01` | `DA_DONG` (closed) | rejected with `409 TICKET_STATUS_NOT_ELIGIBLE` |
| `BH-TEST-OTHER-01` | belongs to center 2 | rejected with `409 TICKET_CENTER_MISMATCH` |

Re-running the seed is safe: every insert uses `ON CONFLICT DO NOTHING`, so a second run adds **0** rows:

```bash
docker compose run --rm db-init      # prints "Đã nạp 0/…" and the same row counts as above
```

---

## 5. Verify it works

Run these after `docker compose up -d --build` has returned. Each check lists the expected result.

| # | Command | Expected result |
|---|---|---|
| 1 | `docker compose ps -a` | `postgres`, `backend`, `frontend` show **`Up … (healthy)`**; `db-init` shows **`Exited (0)`**. |
| 2 | `docker compose logs db-init` | ends with the row-count table of section 4 and `✅ DB-INIT HOÀN TẤT`. |
| 3 | `curl -s http://localhost:3000/api/health` | `{"status":"UP","database":"CONNECTED","timestamp":"…"}` |
| 4 | `curl -s http://localhost:8088/api/health` | the same JSON, this time through Nginx (proves the UI → API proxy). |
| 5 | Open http://localhost:8088 in a browser | screen M1 lists spare parts of center TT01 with stock levels. |
| 6 | `docker compose exec backend npm test` | `# tests 36`, `# pass 36`, `# fail 0` (unit tests + integration tests against the running database). |
| 7 | `docker compose run --rm db-init` (run twice) | `Schema đã có …`, every line `Đã nạp 0/…`, row counts unchanged. |

Example API call (get a test token, then list parts):

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"role":"KTV","center_id":1}' | sed -E 's/.*"token":"([^"]+)".*/\1/')
curl -s "http://localhost:3000/api/parts?center_id=1&size=2" -H "Authorization: Bearer $TOKEN"
```

PowerShell equivalent:

```powershell
$TOKEN = (Invoke-RestMethod -Method Post http://localhost:3000/api/auth/token -ContentType 'application/json' -Body '{"role":"KTV","center_id":1}').token
Invoke-RestMethod "http://localhost:3000/api/parts?center_id=1&size=2" -Headers @{ Authorization = "Bearer $TOKEN" }
```

Expected: HTTP 200 with `"total": 180` and 2 items. The full API reference is in [`docs/api-docs.md`](api-docs.md).

---

## 6. Enabling HTTPS in a real deployment

The prototype runs on `localhost` over plain HTTP. For a real deployment:

1. Put the stack behind a reverse proxy that holds a TLS certificate (e.g. Nginx, Caddy or the platform's load balancer) and only expose port 443 publicly. Do not publish port 3000 directly.
2. Set `TRUST_PROXY=1` in `.env` so Express trusts `X-Forwarded-Proto` / `X-Forwarded-For` from that proxy.
3. Set `CORS_ORIGINS` to the real HTTPS origin of the UI (e.g. `https://inventory.example.com`).
4. Replace `DB_PASSWORD` and `JWT_SECRET` with fresh random values stored in the platform's secret / environment-variable settings — never in the repository or the image.
5. The prototype keeps the access token in `localStorage` and sends it as a `Bearer` header; it sets no cookies. Tokens and passwords are never placed in URLs.
6. `POST /api/auth/token` is a **test-only** endpoint that issues a token for any role; it must be replaced by a real login before any public deployment (see `docs/checklist-bao-mat.md`, item 3).

---

## 7. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `required variable DB_PASSWORD is missing a value` / `JWT_SECRET is not set` | `.env` was not created | `cp .env.example .env`, then `docker compose up -d --build` |
| `Bind for 0.0.0.0:3000 failed: port is already allocated` (or `8088`) | another program uses the port | set `APP_PORT` / `WEB_PORT` in `.env` to a free port (and add the new web origin to `CORS_ORIGINS`), then `docker compose up -d` |
| `dependency failed to start: container …-db-init-1 exited (1)` | database not reachable or data files missing | `docker compose logs db-init`; then `docker compose down -v` and `docker compose up -d --build` |
| Backend restarts with `JWT_SECRET phải … ít nhất 32 ký tự` | `JWT_SECRET` shorter than 32 characters | generate a longer key (section 3) |
| `password authentication failed for user "postgres"` after editing `DB_PASSWORD` | the old password is stored in the existing volume | `docker compose down -v` then `docker compose up -d` |
| UI shows `Phiên làm việc đã hết hạn (401 Unauthorized)` | the 1-hour test token expired | click *🔄 Đăng nhập lại* |

---

## 8. Running without Docker (development only)

Requires Node.js ≥ 20 and a local PostgreSQL ≥ 14 with an empty database `smart_crm`.

```bash
cp .env.example .env        # then set DB_HOST/DB_PORT/DB_USER/DB_PASSWORD for your local PostgreSQL
cd src/backend && npm ci && cd ../frontend && npm ci && cd ../..
npm run migrate             # WARNING: drops and re-creates the 7 L5 tables
npm run seed                # idempotent
npm test                    # 36 tests
npm start                   # API on http://localhost:3000
npm run dev:frontend        # UI on http://localhost:5173 (Vite dev server proxies /api to http://localhost:3000)
```
