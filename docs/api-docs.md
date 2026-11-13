# API Documentation — Smart CRM L5 Part Inventory (v1.0)

Track SE · Business flow L5 (spare-part inventory) · Backend: Node.js 20 / Express 5 / PostgreSQL 16.

This document describes **every route registered in `src/backend/server.js` and `src/backend/src/routes/*.js` — 15 endpoints in total** (3 in `server.js`, 1 in `auth.routes.js`, 5 in `part.routes.js`, 5 in `stock.routes.js`, 1 in `ticket.routes.js`). All example requests and responses were copied from a real run of the `v1.0` Docker stack started from an empty directory (`docker compose up -d --build`, 13 Nov 2026). Long lists are cut where marked `…`; tokens are shortened.

## Contents

| # | Method | Path | Auth | Roles |
|---|---|---|---|---|
| 1 | GET | `/api/hello` | none | — |
| 2 | GET | `/api/health` | none | — |
| 3 | GET | `/api/db-test` | none | — |
| 4 | POST | `/api/auth/token` | none | — (test-only) |
| 5 | GET | `/api/parts` | Bearer | KTV, QUAN_LY_TRUNG_TAM |
| 6 | GET | `/api/parts/:id` | Bearer | KTV, QUAN_LY_TRUNG_TAM |
| 7 | POST | `/api/parts` | Bearer | QUAN_LY_TRUNG_TAM |
| 8 | PUT | `/api/parts/:id` | Bearer | QUAN_LY_TRUNG_TAM |
| 9 | DELETE | `/api/parts/:id` | Bearer | QUAN_LY_TRUNG_TAM |
| 10 | POST | `/api/stock/receipts` | Bearer | QUAN_LY_TRUNG_TAM |
| 11 | POST | `/api/stock/issues` | Bearer | KTV, QUAN_LY_TRUNG_TAM |
| 12 | GET | `/api/stock/alerts` | Bearer | KTV, QUAN_LY_TRUNG_TAM |
| 13 | PUT | `/api/stock/thresholds` | Bearer | QUAN_LY_TRUNG_TAM |
| 14 | GET | `/api/stock/transactions` | Bearer | KTV, QUAN_LY_TRUNG_TAM |
| 15 | GET | `/api/tickets/:ticket_code/parts` | Bearer | KTV, QUAN_LY_TRUNG_TAM |

Count check against the code: `grep -cE "^(app|router)\.(get|post|put|delete)\(" server.js src/routes/*.js` → 3 + 1 + 5 + 5 + 1 = **15**.

---

## Conventions

**Base URL** — `http://localhost:3000` (direct) or `http://localhost:8088` (through the Nginx proxy of the web UI). All paths start with `/api`.

**Authentication** — Protected endpoints require the header `Authorization: Bearer <token>`. Tokens are JWTs signed with HS256 using `JWT_SECRET`; the verifier accepts HS256 only. The payload contains only `userId`, `username`, `role`, `centerId`, `iat`, `exp` — no personal data. Default lifetime: 1 hour (`JWT_EXPIRES_IN`).

**Roles** — `KTV` (technician) and `QUAN_LY_TRUNG_TAM` (center manager).

**Center scope (rule QT-14)** — Every stock, alert, transaction and ticket endpoint works on one service center. `center_id` defaults to the `centerId` in the token; if a request names a different center, the API returns `403 FORBIDDEN`. The parts **catalogue** (`/api/parts/:id`, `POST/PUT/DELETE /api/parts`) is global, not per center.

**Request bodies** — JSON, max 100 kB. Both `snake_case` and `camelCase` keys are accepted on stock endpoints (`center_id` / `centerId`, `part_id` / `partId`, `ticket_code` / `ticketCode`, `min_threshold` / `minThreshold`).

**Numeric types** — PostgreSQL `BIGINT` and `NUMERIC` columns are returned as JSON **strings** (e.g. `"part_id": "19"`, `"unit_price": "1450000.00"`); `INTEGER` columns (quantities, thresholds) are numbers.

**Pagination** — List endpoints accept `page` (default 1, minimum 1) and `size` (default 20, clamped to 1–100) and return `{ items, page, size, total }`.

**Error format** — Every error has the same shape. `fields` maps a field name to a reason (for form validation); `details` keeps the original structure.

```json
{ "error": "DU_LIEU_KHONG_HOP_LE", "message": "Human-readable message (Vietnamese)", "fields": { "quantity": "…" }, "details": [ { "field": "quantity", "reason": "…" } ] }
```

**Error codes used by the API**

| HTTP | `error` | Meaning |
|---|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | Invalid input (missing/invalid field, non-numeric id, bad date, value out of range) |
| 400 | `DU_LIEU_KHONG_HOP_LE` (JSON parse) | Body is not valid JSON — message `Định dạng JSON gửi lên không hợp lệ.` |
| 401 | `UNAUTHENTICATED` | No `Authorization: Bearer` header |
| 401 | `INVALID_TOKEN` | Token signature invalid, wrong algorithm or expired |
| 403 | `FORBIDDEN` | Role not allowed, or the request targets another service center |
| 404 | `PART_NOT_FOUND` | Part id does not exist |
| 404 | `TICKET_NOT_FOUND` | Warranty ticket code does not exist |
| 409 | `DUPLICATE_PART_CODE` | Part code already exists |
| 409 | `CANNOT_DELETE_REFERENCED_PART` | Part has stock transactions and cannot be deleted |
| 409 | `INSUFFICIENT_STOCK` | Issue quantity exceeds the available stock |
| 409 | `TICKET_CENTER_MISMATCH` | Ticket belongs to another center |
| 409 | `TICKET_STATUS_NOT_ELIGIBLE` | Ticket status does not allow issuing parts |
| 500 | `INTERNAL_ERROR` | Unexpected error; details are logged server-side only, never returned |

---

## 1. GET /api/hello

1. **Method and path** — `GET /api/hello`
2. **Description** — Smoke test that the API process is running (does not touch the database).
3. **Authentication** — None.
4. **Parameters / body** — None.
5. **Success response** — `200 OK`
   ```json
   { "message": "Hello Smart CRM - Luồng L5 Kho linh kiện thay thế", "status": "online" }
   ```
6. **Error codes** — None specific (only `500 INTERNAL_ERROR` on unexpected failure).
7. **Notes** — Kept for backwards compatibility with BT2 smoke tests.

## 2. GET /api/health

1. **Method and path** — `GET /api/health`
2. **Description** — Health check used by the Docker healthcheck: confirms the API can query PostgreSQL.
3. **Authentication** — None.
4. **Parameters / body** — None.
5. **Success response** — `200 OK`
   ```json
   { "status": "UP", "database": "CONNECTED", "timestamp": "2026-11-13T07:05:06.824Z" }
   ```
6. **Error codes**
   | HTTP | Body | When |
   |---|---|---|
   | 503 | `{ "status": "DOWN", "database": "DISCONNECTED" }` | `SELECT 1` against the database fails |
7. **Notes** — The 503 body deliberately contains no driver error text; the cause is logged server-side (`[HEALTHCHECK] Database unreachable: <code>`).

## 3. GET /api/db-test

1. **Method and path** — `GET /api/db-test`
2. **Description** — Returns the database server time, to check DB connectivity by hand.
3. **Authentication** — None.
4. **Parameters / body** — None.
5. **Success response** — `200 OK`
   ```json
   { "message": "Database connected successfully!", "time": "2026-11-13T06:53:03.268Z" }
   ```
6. **Error codes** — `500 INTERNAL_ERROR` if the database is unreachable.
7. **Notes** — Since v1.0 the database name is no longer included in the response.

## 4. POST /api/auth/token

1. **Method and path** — `POST /api/auth/token`
2. **Description** — **Test-only** login: issues a JWT for the requested role and service center so the prototype UI and tests can act as a technician or a center manager.
3. **Authentication** — None.
4. **Body**
   | Field | Type | Required | Rule |
   |---|---|---|---|
   | `role` | string | no | `KTV` or `QUAN_LY_TRUNG_TAM`; anything else becomes `KTV` |
   | `center_id` | integer | no | default `1` |
   | `username` | string | no | default `test_user`; copied into the token |

   ```json
   { "role": "KTV", "center_id": 1, "username": "ktv_tt01" }
   ```
5. **Success response** — `200 OK`
   ```json
   {
     "message": "Sinh token kiểm thử thành công",
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjk5OSwidXNlcm5hbWUiOiJrdHZfdHQwMSIs…",
     "user": { "username": "ktv_tt01", "role": "KTV", "centerId": 1 }
   }
   ```
6. **Error codes** — `400 DU_LIEU_KHONG_HOP_LE` only if the body is not valid JSON.
7. **Notes** — Anyone who can reach this endpoint can obtain a manager token for any center. It exists because user accounts and passwords are out of scope for the L5 prototype (see the security checklist, item 3). It must be replaced by a real login before a public deployment.

## 5. GET /api/parts

1. **Method and path** — `GET /api/parts`
2. **Description** — Lists the parts catalogue with the stock quantity and alert threshold of one service center (US1, UC1).
3. **Authentication** — Bearer token; roles `KTV`, `QUAN_LY_TRUNG_TAM`; only the user's own center.
4. **Query parameters**
   | Name | Type | Required | Rule |
   |---|---|---|---|
   | `center_id` | integer | no | default = token `centerId`; another center → 403 |
   | `q` | string | no | case-insensitive match on part code or name |
   | `page`, `size` | integer | no | see Conventions |
5. **Success response** — `200 OK` for `GET /api/parts?center_id=1&q=pin&size=2`
   ```json
   {
     "items": [
       { "part_id": "19", "part_code": "PIN-SS-01", "part_name": "Pin Samsung loại 1", "unit_price": "1450000.00",
         "center_id": "1", "quantity": 0, "min_threshold": 0, "is_below_threshold": false, "updated_at": null },
       { "part_id": "20", "part_code": "PIN-SS-02", "part_name": "Pin Samsung loại 2", "unit_price": "650000.00",
         "center_id": "1", "quantity": 30, "min_threshold": 5, "is_below_threshold": false, "updated_at": "2026-11-13T06:34:30.339Z" }
     ],
     "page": 1, "size": 2, "total": 18
   }
   ```
6. **Error codes**
   | HTTP | `error` | Real example |
   |---|---|---|
   | 401 | `UNAUTHENTICATED` | no header → `Yêu cầu chưa được xác thực. Vui lòng cung cấp JWT token hợp lệ.` |
   | 401 | `INVALID_TOKEN` | tampered signature → `Token xác thực không hợp lệ hoặc đã hết hạn.` |
   | 403 | `FORBIDDEN` | KTV of center 1 asks `center_id=2` → `Không có quyền truy cập dữ liệu của trung tâm #2. Người dùng thuộc trung tâm #1.` |
7. **Notes** — Parts with no stock row in that center are listed with `quantity: 0`, `min_threshold: 0`, `updated_at: null`. `is_below_threshold` is `true` only when `quantity < min_threshold` and `min_threshold > 0` (rule QT-09: equal to the threshold is not an alert).

## 6. GET /api/parts/:id

1. **Method and path** — `GET /api/parts/:id`
2. **Description** — Returns one catalogue entry.
3. **Authentication** — Bearer token; roles `KTV`, `QUAN_LY_TRUNG_TAM`.
4. **Path parameters** — `id`: positive integer.
5. **Success response** — `200 OK` for `GET /api/parts/1`
   ```json
   { "data": { "part_id": "1", "part_code": "MH-SS-01", "part_name": "Màn hình Samsung loại 1", "unit_price": "2200000.00" } }
   ```
6. **Error codes**
   | HTTP | `error` | Real example |
   |---|---|---|
   | 400 | `DU_LIEU_KHONG_HOP_LE` | `/api/parts/abc` → `{"error":"DU_LIEU_KHONG_HOP_LE","message":"Tham số id phải là số nguyên dương.","fields":{"id":"Phải là số nguyên dương."},…}` |
   | 401 | `UNAUTHENTICATED` / `INVALID_TOKEN` | see endpoint 5 |
   | 404 | `PART_NOT_FOUND` | `/api/parts/99999` → `Không tìm thấy linh kiện với mã #99999.` |
7. **Notes** — Catalogue data only; stock levels come from endpoint 5.

## 7. POST /api/parts

1. **Method and path** — `POST /api/parts`
2. **Description** — Adds a new part to the catalogue.
3. **Authentication** — Bearer token; role `QUAN_LY_TRUNG_TAM` only.
4. **Body**
   | Field | Type | Required | Rule |
   |---|---|---|---|
   | `part_code` | string | yes | non-empty, unique |
   | `part_name` | string | yes | non-empty |
   | `unit_price` | number | yes | ≥ 0 |

   ```json
   { "part_code": "DOC-DEMO-01", "part_name": "Linh kien demo API docs", "unit_price": 150000 }
   ```
5. **Success response** — `201 Created`
   ```json
   { "message": "Thêm linh kiện thành công.",
     "data": { "part_id": "181", "part_code": "DOC-DEMO-01", "part_name": "Linh kien demo API docs", "unit_price": "150000.00" } }
   ```
6. **Error codes**
   | HTTP | `error` | Real example |
   |---|---|---|
   | 400 | `DU_LIEU_KHONG_HOP_LE` | empty `part_code` → `Mã linh kiện là bắt buộc.` (`fields: {"field":"part_code"}`) |
   | 401 | `UNAUTHENTICATED` / `INVALID_TOKEN` | see endpoint 5 |
   | 403 | `FORBIDDEN` | KTV token → `Người dùng với vai trò KTV không có quyền thực hiện thao tác này.` |
   | 409 | `DUPLICATE_PART_CODE` | same code again → `Mã linh kiện 'DOC-DEMO-01' đã tồn tại trong hệ thống.` |
7. **Notes** — Codes and names are trimmed. A new part has no stock row until the first receipt (endpoint 10) creates it.

## 8. PUT /api/parts/:id

1. **Method and path** — `PUT /api/parts/:id`
2. **Description** — Updates the name and/or unit price of a catalogue entry.
3. **Authentication** — Bearer token; role `QUAN_LY_TRUNG_TAM` only.
4. **Path / body**
   | Name | Type | Required | Rule |
   |---|---|---|---|
   | `id` (path) | integer | yes | positive integer |
   | `part_name` | string | no | new name |
   | `unit_price` | number | no | ≥ 0 |

   ```json
   { "part_name": "Linh kien demo API docs (sua)", "unit_price": 175000 }
   ```
5. **Success response** — `200 OK`
   ```json
   { "message": "Cập nhật linh kiện thành công.",
     "data": { "part_id": "181", "part_code": "DOC-DEMO-01", "part_name": "Linh kien demo API docs (sua)", "unit_price": "175000.00" } }
   ```
6. **Error codes**
   | HTTP | `error` | Real example |
   |---|---|---|
   | 400 | `DU_LIEU_KHONG_HOP_LE` | `{"unit_price": -1}` → `Đơn giá phải là số không âm.`; non-numeric id → `Tham số id phải là số nguyên dương.` |
   | 401 | `UNAUTHENTICATED` / `INVALID_TOKEN` | see endpoint 5 |
   | 403 | `FORBIDDEN` | KTV token |
   | 404 | `PART_NOT_FOUND` | unknown id |
7. **Notes** — `part_code` cannot be changed (it is the business key used in stock and transactions).

## 9. DELETE /api/parts/:id

1. **Method and path** — `DELETE /api/parts/:id`
2. **Description** — Removes a part from the catalogue if it has never been received or issued.
3. **Authentication** — Bearer token; role `QUAN_LY_TRUNG_TAM` only.
4. **Path parameters** — `id`: positive integer.
5. **Success response** — `200 OK` for `DELETE /api/parts/181`
   ```json
   { "message": "Đã xóa linh kiện #181 thành công." }
   ```
6. **Error codes**
   | HTTP | `error` | Real example |
   |---|---|---|
   | 400 | `DU_LIEU_KHONG_HOP_LE` | non-numeric id |
   | 401 | `UNAUTHENTICATED` / `INVALID_TOKEN` | see endpoint 5 |
   | 403 | `FORBIDDEN` | KTV token |
   | 404 | `PART_NOT_FOUND` | unknown id |
   | 409 | `CANNOT_DELETE_REFERENCED_PART` | `DELETE /api/parts/1` → `Không thể xóa linh kiện đã phát sinh giao dịch nhập/xuất trong lịch sử để bảo toàn dữ liệu.` with `"transaction_count": "38"` |
7. **Notes** — Protects the immutable transaction ledger (rule QT-13): a part referenced by any transaction is never physically deleted.

## 10. POST /api/stock/receipts

1. **Method and path** — `POST /api/stock/receipts`
2. **Description** — Records a goods receipt: increases the stock of one part at one center and writes an immutable `NHAP` transaction (US3, UC3).
3. **Authentication** — Bearer token; role `QUAN_LY_TRUNG_TAM` only; own center only.
4. **Body**
   | Field | Type | Required | Rule |
   |---|---|---|---|
   | `center_id` | integer | yes | > 0, must equal the token's center |
   | `part_id` | integer | yes | > 0, must exist |
   | `quantity` | integer | yes | 1 … 2,147,483,647; resulting stock must also stay ≤ 2,147,483,647 |
   | `reference` | string | no | ≤ 80 characters (voucher number) |

   ```json
   { "center_id": 1, "part_id": 1, "quantity": 5, "reference": "PN-DOC-0001" }
   ```
5. **Success response** — `201 Created`
   ```json
   { "message": "Ghi nhận nhập kho thành công.",
     "data": { "transaction_id": 4955, "type": "NHAP", "center_id": 1, "part_id": 1, "part_code": "MH-SS-01",
               "part_name": "Màn hình Samsung loại 1", "quantity": 5, "new_quantity": 21,
               "occurred_at": "2026-11-13T07:09:01.184Z", "reference": "PN-DOC-0001" } }
   ```
6. **Error codes**
   | HTTP | `error` | Real example |
   |---|---|---|
   | 400 | `DU_LIEU_KHONG_HOP_LE` | `quantity: -5` → `fields: {"quantity":"Số lượng nhập phải là số nguyên lớn hơn 0 và không vượt quá 2147483647."}`; request with **no body** → all three fields reported (`center_id`, `part_id`, `quantity`) |
   | 401 | `UNAUTHENTICATED` / `INVALID_TOKEN` | see endpoint 5 |
   | 403 | `FORBIDDEN` | KTV token → `Người dùng với vai trò KTV không có quyền thực hiện thao tác này.`; other center → `Không có quyền thao tác trên trung tâm #2…` |
   | 404 | `PART_NOT_FOUND` | `part_id: 99999` → `Linh kiện với mã #99999 không tồn tại trong danh mục.` |
7. **Notes** — Runs in one database transaction with a row lock (`SELECT … FOR UPDATE`). If the center has no stock row for the part yet, one is created with `min_threshold = 0`. Transactions are never updated or deleted.

## 11. POST /api/stock/issues

1. **Method and path** — `POST /api/stock/issues`
2. **Description** — Issues parts from stock for a warranty ticket: checks the ticket, decreases stock, links the part to the ticket and writes an `XUAT` transaction (US2, UC2).
3. **Authentication** — Bearer token; roles `KTV`, `QUAN_LY_TRUNG_TAM`; own center only.
4. **Body**
   | Field | Type | Required | Rule |
   |---|---|---|---|
   | `center_id` | integer | yes | > 0, must equal the token's center |
   | `part_id` | integer | yes | > 0, must exist |
   | `ticket_code` | string | yes | non-empty; ticket must exist, belong to the same center and be in `DA_PHAN_CONG`, `DANG_XU_LY` or `CHO_LINH_KIEN` |
   | `quantity` | integer | yes | 1 … available stock |

   ```json
   { "center_id": 1, "part_id": 2, "ticket_code": "BH-TEST-ACTIVE-01", "quantity": 1 }
   ```
5. **Success response** — `201 Created`
   ```json
   { "message": "Xuất kho linh kiện thành công.",
     "data": { "transaction_id": 4956, "type": "XUAT", "center_id": 1, "part_id": 2, "part_code": "MH-SS-02",
               "part_name": "Màn hình Samsung loại 2", "ticket_code": "BH-TEST-ACTIVE-01", "ticket_id": 7801,
               "quantity": 1, "new_quantity": 9, "min_threshold": 3, "is_below_threshold": false,
               "occurred_at": "2026-11-13T07:09:01.205Z" } }
   ```
6. **Error codes**
   | HTTP | `error` | Real example |
   |---|---|---|
   | 400 | `DU_LIEU_KHONG_HOP_LE` | no `ticket_code`, `quantity: 0` → `fields: {"ticket_code":"Mã phiếu bảo hành là bắt buộc.","quantity":"Số lượng xuất phải là số nguyên lớn hơn 0 và không vượt quá 2147483647."}` |
   | 401 | `UNAUTHENTICATED` / `INVALID_TOKEN` | see endpoint 5 |
   | 403 | `FORBIDDEN` | KTV of center 1 sends `center_id: 2` → `Không có quyền thao tác trên trung tâm #2. Người dùng thuộc trung tâm #1.` |
   | 404 | `TICKET_NOT_FOUND` | `BH-KHONG-TON-TAI` → `Không tìm thấy phiếu bảo hành với mã BH-KHONG-TON-TAI trong hệ thống.` |
   | 404 | `PART_NOT_FOUND` | unknown `part_id` |
   | 409 | `INSUFFICIENT_STOCK` | `quantity: 100000` → `Số lượng tồn kho không đủ để xuất. Tồn hiện tại: 12, yêu cầu xuất: 100000.` with `available_quantity`, `requested_quantity` |
   | 409 | `TICKET_STATUS_NOT_ELIGIBLE` | `BH-TEST-INVALID-01` → `… đang ở trạng thái 'DA_DONG', không thuộc diện được phép xuất linh kiện.` with `allowed_statuses` |
   | 409 | `TICKET_CENTER_MISMATCH` | `BH-TEST-OTHER-01` → `Phiếu bảo hành BH-TEST-OTHER-01 thuộc trung tâm #2, không khớp với trung tâm #1 đang thao tác.` |
7. **Notes** — The stock row is locked with `SELECT … FOR UPDATE` so two concurrent issues cannot drive stock below zero (rule QT-09). Issuing exactly the available quantity is allowed (stock becomes 0). `is_below_threshold` in the response tells the UI to raise the low-stock alert.

## 12. GET /api/stock/alerts

1. **Method and path** — `GET /api/stock/alerts`
2. **Description** — Lists parts of a center whose stock is below their alert threshold (US4, UC5).
3. **Authentication** — Bearer token; roles `KTV`, `QUAN_LY_TRUNG_TAM`; own center only.
4. **Query parameters** — `center_id` (default = token center), `page`, `size`.
5. **Success response** — `200 OK` for `GET /api/stock/alerts?center_id=1&size=2`
   ```json
   { "items": [
       { "part_id": "27", "part_code": "PIN-OP-03", "part_name": "Pin OPPO loại 3", "unit_price": "650000.00", "center_id": "1",
         "quantity": 0, "min_threshold": 5, "is_below_threshold": true, "updated_at": "2026-11-13T06:34:30.339Z" },
       { "part_id": "30", "part_code": "PIN-RM-03", "part_name": "Pin realme loại 3", "unit_price": "420000.00", "center_id": "1",
         "quantity": 0, "min_threshold": 3, "is_below_threshold": true, "updated_at": "2026-11-13T06:34:30.339Z" } ],
     "page": 1, "size": 2, "total": 20 }
   ```
6. **Error codes** — `401 UNAUTHENTICATED` / `INVALID_TOKEN`; `403 FORBIDDEN` for another center.
7. **Notes** — Same alert rule as endpoint 5 (`quantity < min_threshold` and `min_threshold > 0`).

## 13. PUT /api/stock/thresholds

1. **Method and path** — `PUT /api/stock/thresholds`
2. **Description** — Sets the low-stock alert threshold of one part at one center (US5, UC6).
3. **Authentication** — Bearer token; role `QUAN_LY_TRUNG_TAM` only; own center only.
4. **Body**
   | Field | Type | Required | Rule |
   |---|---|---|---|
   | `center_id` | integer | yes | must equal the token's center |
   | `part_id` | integer | yes | must exist |
   | `min_threshold` | integer | yes | 0 … 2,147,483,647 (0 disables the alert) |

   ```json
   { "center_id": 1, "part_id": 2, "min_threshold": 12 }
   ```
5. **Success response** — `200 OK`
   ```json
   { "message": "Cập nhật ngưỡng cảnh báo thành công.",
     "data": { "center_id": 1, "part_id": 2, "part_code": "MH-SS-02", "part_name": "Màn hình Samsung loại 2",
               "quantity": 12, "min_threshold": 12, "is_below_threshold": false, "updated_at": "2026-11-13T06:53:03.429Z" } }
   ```
6. **Error codes**
   | HTTP | `error` | Real example |
   |---|---|---|
   | 400 | `DU_LIEU_KHONG_HOP_LE` | `min_threshold: -1` → `Ngưỡng cảnh báo phải là số nguyên không âm (>= 0) và không vượt quá 2147483647.` |
   | 401 | `UNAUTHENTICATED` / `INVALID_TOKEN` | see endpoint 5 |
   | 403 | `FORBIDDEN` | KTV token → `Người dùng với vai trò KTV không có quyền thực hiện thao tác này.` |
   | 404 | `PART_NOT_FOUND` | unknown `part_id` |
7. **Notes** — The example shows the boundary: `quantity` 12 equal to `min_threshold` 12 is **not** an alert.

## 14. GET /api/stock/transactions

1. **Method and path** — `GET /api/stock/transactions`
2. **Description** — Lists the stock movement ledger of a center, newest first (US6, UC7).
3. **Authentication** — Bearer token; roles `KTV`, `QUAN_LY_TRUNG_TAM`; own center only.
4. **Query parameters**
   | Name | Type | Required | Rule |
   |---|---|---|---|
   | `center_id` | integer | no | default = token center |
   | `part_id` | integer | no | filter by part |
   | `type` | string | no | `NHAP` or `XUAT` (case-insensitive); any other value matches nothing |
   | `from`, `to` | date | no | `YYYY-MM-DD`; `to` is inclusive (until 23:59:59.999) |
   | `page`, `size` | integer | no | see Conventions |
5. **Success response** — `200 OK` for `GET /api/stock/transactions?center_id=1&type=XUAT&size=2`
   ```json
   { "items": [
       { "transaction_id": "4958", "center_id": "1", "part_id": "2", "part_code": "MH-SS-02", "part_name": "Màn hình Samsung loại 2",
         "ticket_part_id": "4065", "ticket_code": "BH-TEST-ACTIVE-01", "type": "XUAT", "quantity": 1,
         "occurred_at": "2026-11-13T06:53:03.390Z", "reference": "BH-TEST-ACTIVE-01" },
       … ],
     "page": 1, "size": 2, "total": 715 }
   ```
6. **Error codes**
   | HTTP | `error` | Real example |
   |---|---|---|
   | 400 | `DU_LIEU_KHONG_HOP_LE` | `from=khong-phai-ngay` → `{"error":"DU_LIEU_KHONG_HOP_LE","message":"Tham số from phải là ngày hợp lệ dạng YYYY-MM-DD.","fields":{"from":"Định dạng YYYY-MM-DD."},…}` |
   | 401 | `UNAUTHENTICATED` / `INVALID_TOKEN` | see endpoint 5 |
   | 403 | `FORBIDDEN` | another center |
7. **Notes** — Read-only view of the immutable ledger; there is no endpoint to edit or delete a transaction (rule QT-13). `ticket_code` is `null` for receipts.

## 15. GET /api/tickets/:ticket_code/parts

1. **Method and path** — `GET /api/tickets/:ticket_code/parts`
2. **Description** — Lists the parts issued for one warranty ticket (US7, UC8).
3. **Authentication** — Bearer token; roles `KTV`, `QUAN_LY_TRUNG_TAM`; own center only.
4. **Parameters** — path `ticket_code` (string); query `center_id` (default = token center).
5. **Success response** — `200 OK` for `GET /api/tickets/BH-TEST-ACTIVE-01/parts?center_id=1`
   ```json
   { "ticket_code": "BH-TEST-ACTIVE-01", "center_id": 1, "total_items": 2,
     "items": [
       { "transaction_id": "4956", "center_id": "1", "part_id": "2", "part_code": "MH-SS-02", "part_name": "Màn hình Samsung loại 2",
         "unit_price": "150000.00", "quantity": 2, "occurred_at": "2026-11-13T06:51:53.234Z", "ticket_code": "BH-TEST-ACTIVE-01" },
       … ] }
   ```
6. **Error codes** — `401 UNAUTHENTICATED` / `INVALID_TOKEN`; `403 FORBIDDEN` for another center.
7. **Notes** — An unknown ticket code is **not** an error: the API returns `200` with `"total_items": 0, "items": []` (real run with `BH-KHONG-TON-TAI`). Only `XUAT` transactions of the given center are included, oldest first.

---

## Reproducing the examples

Start the stack as described in [`deployment-guide.md`](deployment-guide.md), get a token from endpoint 4 and call the endpoints with `curl` or the PowerShell snippet in section 5 of the Deployment Guide. All examples above come from one capture run against a freshly started stack; the main success and error paths are also exercised by the automated tests (`docker compose exec backend npm test`, 36 tests) and by the Buổi 14 test report (`docs/test-report.md`).
