const { describe, it } = require("node:test");
const assert = require("node:assert");
const app = require("../../server");

describe("4. Integration Test - Toàn trình API với CSDL PostgreSQL thật - Luồng L5", () => {
  let server;
  let port;
  let baseUrl;
  let tokenKtv;
  let tokenQltt;

  it("Khởi động server test nội bộ và lấy Token xác thực cho 2 vai trò", async () => {
    server = app.listen(0); // Cổng ngẫu nhiên
    port = server.address().port;
    baseUrl = `http://localhost:${port}`;

    // Token cho KTV trung tâm 1
    const resKtv = await fetch(`${baseUrl}/api/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "KTV", center_id: 1, username: "ktv_tt01" }),
    }).then((r) => r.json());
    tokenKtv = resKtv.token;
    assert.ok(tokenKtv);

    // Token cho QLTT trung tâm 1
    const resQltt = await fetch(`${baseUrl}/api/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "QUAN_LY_TRUNG_TAM", center_id: 1, username: "qltt_tt01" }),
    }).then((r) => r.json());
    tokenQltt = resQltt.token;
    assert.ok(tokenQltt);
  });

  it("API-IT-01: GET /api/parts - Tra cứu danh mục và tồn kho thành công", async () => {
    const res = await fetch(`${baseUrl}/api/parts?center_id=1&size=5`, {
      headers: { Authorization: `Bearer ${tokenKtv}` },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.total, 180);
    assert.strictEqual(body.items.length, 5);
  });

  it("API-IT-02: POST /api/stock/receipts - Quản lý trung tâm nhập kho thành công", async () => {
    const res = await fetch(`${baseUrl}/api/stock/receipts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenQltt}`,
      },
      body: JSON.stringify({
        center_id: 1,
        part_id: 2,
        quantity: 5,
        reference: "PN-INTEGRATION-TEST",
      }),
    });
    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.data.type, "NHAP");
    assert.strictEqual(body.data.quantity, 5);
  });

  it("API-IT-03: POST /api/stock/issues - KTV xuất kho linh kiện theo phiếu thành công", async () => {
    const res = await fetch(`${baseUrl}/api/stock/issues`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenKtv}`,
      },
      body: JSON.stringify({
        center_id: 1,
        part_id: 2,
        ticket_code: "BH-TEST-ACTIVE-01",
        quantity: 2,
      }),
    });
    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.data.type, "XUAT");
    assert.strictEqual(body.data.ticket_code, "BH-TEST-ACTIVE-01");
  });

  it("API-IT-04: POST /api/stock/issues - Từ chối khi xuất cho phiếu đã đóng (DA_DONG)", async () => {
    const res = await fetch(`${baseUrl}/api/stock/issues`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenKtv}`,
      },
      body: JSON.stringify({
        center_id: 1,
        part_id: 2,
        ticket_code: "BH-TEST-INVALID-01", // Phiếu DA_DONG
        quantity: 1,
      }),
    });
    assert.strictEqual(res.status, 409);
    const body = await res.json();
    assert.strictEqual(body.error, "TICKET_STATUS_NOT_ELIGIBLE");
  });

  it("API-IT-05: PUT /api/stock/thresholds - Thiết lập ngưỡng cảnh báo thành công", async () => {
    const res = await fetch(`${baseUrl}/api/stock/thresholds`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenQltt}`,
      },
      body: JSON.stringify({
        center_id: 1,
        part_id: 2,
        min_threshold: 12,
      }),
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.min_threshold, 12);
  });

  it("API-IT-06: GET /api/stock/alerts - Lọc danh sách cảnh báo dưới ngưỡng thành công", async () => {
    const res = await fetch(`${baseUrl}/api/stock/alerts?center_id=1`, {
      headers: { Authorization: `Bearer ${tokenQltt}` },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.items));
    assert.ok(body.total >= 1);
  });

  it("API-IT-07: GET /api/stock/transactions - Xem lịch sử giao dịch kho", async () => {
    const res = await fetch(`${baseUrl}/api/stock/transactions?center_id=1&size=5`, {
      headers: { Authorization: `Bearer ${tokenQltt}` },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.total >= 800, `Expected total >= 800 for center 1, got ${body.total}`);
    assert.strictEqual(body.items.length, 5);
  });

  it("Đóng server test tích hợp", async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
