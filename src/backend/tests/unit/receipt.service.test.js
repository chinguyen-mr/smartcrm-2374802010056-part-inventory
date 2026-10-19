const { describe, it } = require("node:test");
const assert = require("node:assert");
const { ReceiptService } = require("../../src/services/receipt.service");
const AppError = require("../../src/errors/AppError");

function createMockDbPool() {
  const client = {
    query: async (sql) => {
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

describe("2. Unit Test - Nghiệp vụ Nhập kho (ReceiptService) - Luồng L5", () => {
  it("TC11-Positive: Ghi nhận nhập kho thành công cho linh kiện đã có tồn kho (US3, UC3, FR5)", async () => {
    const mockStockRepo = {
      findStockForUpdate: async () => ({ quantity: 10 }),
      updateQuantity: async (cId, pId, newQty) => ({ quantity: newQty }),
    };

    const mockTxRepo = {
      create: async (txData) => ({
        transaction_id: 2001,
        ...txData,
        occurred_at: new Date().toISOString(),
      }),
    };

    const mockPartRepo = {
      findById: async () => ({
        part_id: 1,
        part_code: "MH-SS-01",
        part_name: "Màn hình Samsung",
      }),
    };

    const service = new ReceiptService(mockStockRepo, mockTxRepo, mockPartRepo, createMockDbPool());

    const result = await service.receiveStock(
      { centerId: 1, partId: 1, quantity: 15, reference: "PN-2026-001" },
      { centerId: 1 }
    );

    assert.strictEqual(result.type, "NHAP");
    assert.strictEqual(result.quantity, 15);
    assert.strictEqual(result.new_quantity, 25); // 10 + 15 = 25
    assert.strictEqual(result.reference, "PN-2026-001");
  });

  it("TC12-Positive: Nhập kho tự động khởi tạo dòng tồn mới khi cặp trung tâm/linh kiện chưa có tồn (G5)", async () => {
    const mockStockRepo = {
      findStockForUpdate: async () => null, // Chưa có dòng tồn
      createStock: async (cId, pId, qty) => ({ quantity: qty }),
    };
    const mockTxRepo = {
      create: async (txData) => ({ transaction_id: 2002, ...txData }),
    };
    const mockPartRepo = {
      findById: async () => ({ part_code: "MH-NEW-01", part_name: "Linh kiện mới" }),
    };

    const service = new ReceiptService(mockStockRepo, mockTxRepo, mockPartRepo, createMockDbPool());

    const result = await service.receiveStock(
      { centerId: 1, partId: 99, quantity: 20 },
      { centerId: 1 }
    );

    assert.strictEqual(result.type, "NHAP");
    assert.strictEqual(result.new_quantity, 20);
  });

  it("TC13-Boundary: Nhập kho với số lượng tối thiểu là 1 thành công", async () => {
    const mockStockRepo = {
      findStockForUpdate: async () => ({ quantity: 0 }),
      updateQuantity: async (cId, pId, newQty) => ({ quantity: newQty }),
    };
    const mockTxRepo = {
      create: async (txData) => ({ transaction_id: 2003, ...txData }),
    };
    const mockPartRepo = {
      findById: async () => ({ part_code: "MH-SS-01" }),
    };

    const service = new ReceiptService(mockStockRepo, mockTxRepo, mockPartRepo, createMockDbPool());

    const result = await service.receiveStock(
      { centerId: 1, partId: 1, quantity: 1 },
      { centerId: 1 }
    );

    assert.strictEqual(result.new_quantity, 1);
  });

  it("TC14-Negative: Từ chối nhập kho khi số lượng <= 0", async () => {
    const service = new ReceiptService();

    await assert.rejects(
      async () => {
        await service.receiveStock(
          { centerId: 1, partId: 1, quantity: 0 },
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
  });

  it("TC15-Negative: Từ chối nhập kho khi linh kiện không tồn tại trong danh mục", async () => {
    const mockPartRepo = {
      findById: async () => null,
    };

    const service = new ReceiptService({}, {}, mockPartRepo, createMockDbPool());

    await assert.rejects(
      async () => {
        await service.receiveStock(
          { centerId: 1, partId: 9999, quantity: 10 },
          { centerId: 1 }
        );
      },
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.errorCode, "PART_NOT_FOUND");
        assert.strictEqual(err.statusCode, 404);
        return true;
      }
    );
  });

  it("TC16-Negative: Từ chối khi người dùng thao tác trung tâm ngoài quyền (QT-14)", async () => {
    const service = new ReceiptService();

    await assert.rejects(
      async () => {
        await service.receiveStock(
          { centerId: 2, partId: 1, quantity: 10 },
          { centerId: 1 } // Người dùng thuộc trung tâm 1
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
});
