const { describe, it } = require("node:test");
const assert = require("node:assert");
const { IssueService } = require("../../src/services/issue.service");
const AppError = require("../../src/errors/AppError");

// Factory tạo mock database pool hỗ trợ transaction
function createMockDbPool() {
  const client = {
    query: async (sql, params) => {
      if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") {
        return { rowCount: 1 };
      }
      return { rows: [] };
    },
    release: () => {},
  };
  return {
    connect: async () => client,
  };
}

describe("1. Unit Test - Nghiệp vụ Xuất kho (IssueService) - Luồng L5", () => {
  // ==========================================
  // NHÓM 1: POSITIVE - LUỒNG ĐÚNG
  // ==========================================
  it("TC01-Positive: Xuất kho thành công khi phiếu hợp lệ và tồn kho đủ (QT-09, QT-13)", async () => {
    // Chuẩn bị Mock Repositories
    const mockStockRepo = {
      findStockForUpdate: async (cId, pId, client) => ({
        center_id: cId,
        part_id: pId,
        quantity: 10,
        min_threshold: 3,
      }),
      updateQuantity: async (cId, pId, newQty, client) => ({
        center_id: cId,
        part_id: pId,
        quantity: newQty,
        min_threshold: 3,
      }),
    };

    const mockTxRepo = {
      create: async (txData, client) => ({
        transaction_id: 1001,
        ...txData,
        occurred_at: new Date().toISOString(),
      }),
    };

    const mockPartRepo = {
      findById: async (id) => ({
        part_id: id,
        part_code: "MH-SS-01",
        part_name: "Màn hình Samsung",
      }),
    };

    const mockTicketRepo = {
      createTicketPart: async (data, client) => ({
        ticket_part_id: 501,
        ...data,
      }),
      updateTransactionId: async (tpId, txId, client) => ({
        ticket_part_id: tpId,
        transaction_id: txId,
      }),
    };

    const mockAdapter = {
      verifyTicketForIssue: async (tCode, cId, client) => ({
        ticket_id: 201,
        center_id: cId,
        ticket_code: tCode,
        status: "DANG_XU_LY",
      }),
    };

    const service = new IssueService(
      mockStockRepo,
      mockTxRepo,
      mockPartRepo,
      mockTicketRepo,
      mockAdapter,
      createMockDbPool()
    );

    const user = { userId: 1, role: "KTV", centerId: 1 };
    const result = await service.issueStock(
      { centerId: 1, partId: 1, ticketCode: "BH-TEST-ACTIVE-01", quantity: 2 },
      user
    );

    // Kiểm chứng kết quả nghiệp vụ
    assert.strictEqual(result.type, "XUAT");
    assert.strictEqual(result.quantity, 2);
    assert.strictEqual(result.new_quantity, 8); // 10 - 2 = 8
    assert.strictEqual(result.is_below_threshold, false); // 8 > 3 -> không cảnh báo
    assert.strictEqual(result.ticket_code, "BH-TEST-ACTIVE-01");
  });

  // ==========================================
  // NHÓM 2: BOUNDARY - GIÁ TRỊ BIÊN
  // ==========================================
  it("TC02-Boundary: Xuất số lượng đúng bằng tồn kho hiện tại (tồn giảm về 0 hợp lệ)", async () => {
    const mockStockRepo = {
      findStockForUpdate: async () => ({ quantity: 5, min_threshold: 0 }),
      updateQuantity: async (cId, pId, newQty) => ({ quantity: newQty, min_threshold: 0 }),
    };
    const mockTxRepo = { create: async (d) => ({ transaction_id: 1002, ...d }) };
    const mockPartRepo = { findById: async () => ({ part_code: "MH-SS-01" }) };
    const mockTicketRepo = {
      createTicketPart: async (d) => ({ ticket_part_id: 502, ...d }),
      updateTransactionId: async () => ({}),
    };
    const mockAdapter = { verifyTicketForIssue: async () => ({ ticket_id: 202 }) };

    const service = new IssueService(
      mockStockRepo,
      mockTxRepo,
      mockPartRepo,
      mockTicketRepo,
      mockAdapter,
      createMockDbPool()
    );

    const result = await service.issueStock(
      { centerId: 1, partId: 1, ticketCode: "BH-TEST-ACTIVE-01", quantity: 5 },
      { centerId: 1 }
    );

    assert.strictEqual(result.new_quantity, 0); // Về đúng 0 thành công
    assert.strictEqual(result.is_below_threshold, false); // min_threshold = 0 thì không cảnh báo
  });

  it("TC03-Boundary: Tồn sau khi xuất bằng đúng ngưỡng (quantity == min_threshold) không cảnh báo (QT-09)", async () => {
    const mockStockRepo = {
      findStockForUpdate: async () => ({ quantity: 5, min_threshold: 3 }),
      updateQuantity: async (cId, pId, newQty) => ({ quantity: newQty, min_threshold: 3 }),
    };
    const mockTxRepo = { create: async (d) => ({ transaction_id: 1003, ...d }) };
    const mockPartRepo = { findById: async () => ({ part_code: "MH-SS-01" }) };
    const mockTicketRepo = {
      createTicketPart: async (d) => ({ ticket_part_id: 503, ...d }),
      updateTransactionId: async () => ({}),
    };
    const mockAdapter = { verifyTicketForIssue: async () => ({ ticket_id: 203 }) };

    const service = new IssueService(
      mockStockRepo,
      mockTxRepo,
      mockPartRepo,
      mockTicketRepo,
      mockAdapter,
      createMockDbPool()
    );

    // Xuất 2, tồn từ 5 còn 3 (đúng bằng ngưỡng 3)
    const result = await service.issueStock(
      { centerId: 1, partId: 1, ticketCode: "BH-TEST-ACTIVE-01", quantity: 2 },
      { centerId: 1 }
    );

    assert.strictEqual(result.new_quantity, 3);
    assert.strictEqual(result.min_threshold, 3);
    assert.strictEqual(result.is_below_threshold, false); // QT-09: Bằng ngưỡng KHÔNG cảnh báo
  });

  it("TC04-Boundary: Tồn sau khi xuất nhỏ hơn ngưỡng (quantity < min_threshold) phát sinh cảnh báo (QT-09)", async () => {
    const mockStockRepo = {
      findStockForUpdate: async () => ({ quantity: 5, min_threshold: 4 }),
      updateQuantity: async (cId, pId, newQty) => ({ quantity: newQty, min_threshold: 4 }),
    };
    const mockTxRepo = { create: async (d) => ({ transaction_id: 1004, ...d }) };
    const mockPartRepo = { findById: async () => ({ part_code: "MH-SS-01" }) };
    const mockTicketRepo = {
      createTicketPart: async (d) => ({ ticket_part_id: 504, ...d }),
      updateTransactionId: async () => ({}),
    };
    const mockAdapter = { verifyTicketForIssue: async () => ({ ticket_id: 204 }) };

    const service = new IssueService(
      mockStockRepo,
      mockTxRepo,
      mockPartRepo,
      mockTicketRepo,
      mockAdapter,
      createMockDbPool()
    );

    // Xuất 2, tồn từ 5 còn 3 (< ngưỡng 4)
    const result = await service.issueStock(
      { centerId: 1, partId: 1, ticketCode: "BH-TEST-ACTIVE-01", quantity: 2 },
      { centerId: 1 }
    );

    assert.strictEqual(result.new_quantity, 3);
    assert.strictEqual(result.min_threshold, 4);
    assert.strictEqual(result.is_below_threshold, true); // QT-09: Nhỏ hơn ngưỡng BẬT cảnh báo
  });

  // ==========================================
  // NHÓM 3: NEGATIVE - DỮ LIỆU SAI / TỪ CHỐI
  // ==========================================
  it("TC05-Negative: Từ chối xuất khi số lượng yêu cầu vượt quá tồn kho hiện tại (QT-09)", async () => {
    const mockStockRepo = {
      findStockForUpdate: async () => ({ quantity: 2, min_threshold: 5 }), // Tồn chỉ có 2
    };
    const mockTxRepo = { create: async () => {} };
    const mockPartRepo = { findById: async () => ({ part_code: "MH-SS-01" }) };
    const mockTicketRepo = { createTicketPart: async () => {} };
    const mockAdapter = { verifyTicketForIssue: async () => ({ ticket_id: 205 }) };

    const service = new IssueService(
      mockStockRepo,
      mockTxRepo,
      mockPartRepo,
      mockTicketRepo,
      mockAdapter,
      createMockDbPool()
    );

    // Yêu cầu xuất 3 (vượt tồn 2)
    await assert.rejects(
      async () => {
        await service.issueStock(
          { centerId: 1, partId: 1, ticketCode: "BH-TEST-ACTIVE-01", quantity: 3 },
          { centerId: 1 }
        );
      },
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.errorCode, "INSUFFICIENT_STOCK");
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.details.available_quantity, 2);
        assert.strictEqual(err.details.requested_quantity, 3);
        return true;
      }
    );
  });

  it("TC06-Negative: Từ chối xuất khi số lượng không phải số nguyên dương", async () => {
    const service = new IssueService();

    // Số lượng âm
    await assert.rejects(
      async () => {
        await service.issueStock(
          { centerId: 1, partId: 1, ticketCode: "BH-TEST-ACTIVE-01", quantity: -5 },
          { centerId: 1 }
        );
      },
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.errorCode, "DU_LIEU_KHONG_HOP_LE");
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );

    // Số lượng bằng 0
    await assert.rejects(
      async () => {
        await service.issueStock(
          { centerId: 1, partId: 1, ticketCode: "BH-TEST-ACTIVE-01", quantity: 0 },
          { centerId: 1 }
        );
      },
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.errorCode, "DU_LIEU_KHONG_HOP_LE");
        return true;
      }
    );
  });

  it("TC07-Negative: Từ chối xuất khi người dùng truy cập trái phép trung tâm khác (QT-14)", async () => {
    const service = new IssueService();

    // User thuộc trung tâm 1 nhưng gửi request xuất kho tại trung tâm 2
    const user = { userId: 99, role: "KTV", centerId: 1 };
    await assert.rejects(
      async () => {
        await service.issueStock(
          { centerId: 2, partId: 1, ticketCode: "BH-TEST-ACTIVE-01", quantity: 1 },
          user
        );
      },
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.errorCode, "FORBIDDEN");
        assert.strictEqual(err.statusCode, 403);
        return true;
      }
    );
  });

  it("TC08-Negative: Từ chối xuất khi phiếu bảo hành không tồn tại", async () => {
    const mockStockRepo = { findStockForUpdate: async () => ({ quantity: 10 }) };
    const mockPartRepo = { findById: async () => ({ part_code: "MH-SS-01" }) };
    const mockAdapter = {
      verifyTicketForIssue: async (code) => {
        throw new AppError("TICKET_NOT_FOUND", `Không tìm thấy phiếu ${code}`, 404);
      },
    };

    const service = new IssueService(
      mockStockRepo,
      {},
      mockPartRepo,
      {},
      mockAdapter,
      createMockDbPool()
    );

    await assert.rejects(
      async () => {
        await service.issueStock(
          { centerId: 1, partId: 1, ticketCode: "BH-KHONG-TON-TAI", quantity: 1 },
          { centerId: 1 }
        );
      },
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.errorCode, "TICKET_NOT_FOUND");
        assert.strictEqual(err.statusCode, 404);
        return true;
      }
    );
  });

  it("TC09-Negative: Từ chối xuất khi phiếu thuộc trung tâm khác", async () => {
    const mockStockRepo = { findStockForUpdate: async () => ({ quantity: 10 }) };
    const mockPartRepo = { findById: async () => ({ part_code: "MH-SS-01" }) };
    const mockAdapter = {
      verifyTicketForIssue: async (code, cId) => {
        throw new AppError("TICKET_CENTER_MISMATCH", `Phiếu không thuộc trung tâm ${cId}`, 409);
      },
    };

    const service = new IssueService(
      mockStockRepo,
      {},
      mockPartRepo,
      {},
      mockAdapter,
      createMockDbPool()
    );

    await assert.rejects(
      async () => {
        await service.issueStock(
          { centerId: 1, partId: 1, ticketCode: "BH-CUA-TT02", quantity: 1 },
          { centerId: 1 }
        );
      },
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.errorCode, "TICKET_CENTER_MISMATCH");
        assert.strictEqual(err.statusCode, 409);
        return true;
      }
    );
  });

  it("TC10-Negative: Từ chối xuất khi trạng thái phiếu không nằm trong allowlist", async () => {
    const mockStockRepo = { findStockForUpdate: async () => ({ quantity: 10 }) };
    const mockPartRepo = { findById: async () => ({ part_code: "MH-SS-01" }) };
    const mockAdapter = {
      verifyTicketForIssue: async (code) => {
        throw new AppError(
          "TICKET_STATUS_NOT_ELIGIBLE",
          `Phiếu đang ở trạng thái DA_DONG, không được phép xuất linh kiện.`,
          409
        );
      },
    };

    const service = new IssueService(
      mockStockRepo,
      {},
      mockPartRepo,
      {},
      mockAdapter,
      createMockDbPool()
    );

    await assert.rejects(
      async () => {
        await service.issueStock(
          { centerId: 1, partId: 1, ticketCode: "BH-DA-DONG-01", quantity: 1 },
          { centerId: 1 }
        );
      },
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.errorCode, "TICKET_STATUS_NOT_ELIGIBLE");
        assert.strictEqual(err.statusCode, 409);
        return true;
      }
    );
  });
});
