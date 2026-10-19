const { describe, it } = require("node:test");
const assert = require("node:assert");
const { StockService } = require("../../src/services/stock.service");
const AppError = require("../../src/errors/AppError");

describe("3. Unit Test - Nghiệp vụ Quản lý Ngưỡng & Tra cứu Tồn kho (StockService) - Luồng L5", () => {
  it("TC17-Positive: Thiết lập ngưỡng cảnh báo thành công bởi Quản lý trung tâm (US5, UC6, FR8)", async () => {
    const mockStockRepo = {
      setThreshold: async (cId, pId, minTh) => ({
        center_id: cId,
        part_id: pId,
        quantity: 5,
        min_threshold: minTh,
        updated_at: new Date().toISOString(),
      }),
    };
    const mockPartRepo = {
      findById: async () => ({ part_code: "MH-SS-01", part_name: "Màn hình Samsung" }),
    };

    const service = new StockService(mockStockRepo, {}, mockPartRepo);

    const user = { role: "QUAN_LY_TRUNG_TAM", centerId: 1 };
    const result = await service.setThreshold(
      { centerId: 1, partId: 1, minThreshold: 8 },
      user
    );

    assert.strictEqual(result.min_threshold, 8);
    assert.strictEqual(result.quantity, 5);
    assert.strictEqual(result.is_below_threshold, true); // 5 < 8 -> Cảnh báo
  });

  it("TC18-Positive: Tra cứu danh sách linh kiện dưới ngưỡng cảnh báo (US4, UC5, FR7)", async () => {
    const mockStockRepo = {
      findPartsWithStock: async ({ centerId, belowThresholdOnly }) => {
        assert.strictEqual(centerId, 1);
        assert.strictEqual(belowThresholdOnly, true);
        return {
          items: [{ part_code: "MH-SS-01", quantity: 2, min_threshold: 5, is_below_threshold: true }],
          total: 1,
        };
      },
    };

    const service = new StockService(mockStockRepo, {}, {});
    const result = await service.getStockAlerts({ centerId: 1 }, { centerId: 1 });

    assert.strictEqual(result.total, 1);
    assert.strictEqual(result.items[0].is_below_threshold, true);
  });

  it("TC19-Boundary: Thiết lập ngưỡng cảnh báo bằng 0 thành công (min_threshold = 0 không cảnh báo)", async () => {
    const mockStockRepo = {
      setThreshold: async (cId, pId, minTh) => ({
        center_id: cId,
        part_id: pId,
        quantity: 0,
        min_threshold: minTh,
        updated_at: new Date().toISOString(),
      }),
    };
    const mockPartRepo = {
      findById: async () => ({ part_code: "MH-SS-01" }),
    };

    const service = new StockService(mockStockRepo, {}, mockPartRepo);

    const user = { role: "QUAN_LY_TRUNG_TAM", centerId: 1 };
    const result = await service.setThreshold(
      { centerId: 1, partId: 1, minThreshold: 0 },
      user
    );

    assert.strictEqual(result.min_threshold, 0);
    assert.strictEqual(result.is_below_threshold, false); // Ngưỡng 0 thì không bao giờ cảnh báo
  });

  it("TC20-Negative: Kỹ thuật viên (KTV) không có quyền thiết lập ngưỡng cảnh báo (FORBIDDEN)", async () => {
    const service = new StockService();
    const userKtv = { role: "KTV", centerId: 1 };

    await assert.rejects(
      async () => {
        await service.setThreshold(
          { centerId: 1, partId: 1, minThreshold: 5 },
          userKtv
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

  it("TC21-Negative: Từ chối thiết lập ngưỡng cảnh báo là số âm", async () => {
    const service = new StockService();
    const user = { role: "QUAN_LY_TRUNG_TAM", centerId: 1 };

    await assert.rejects(
      async () => {
        await service.setThreshold(
          { centerId: 1, partId: 1, minThreshold: -1 },
          user
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

  it("TC22-Negative: Từ chối tra cứu tồn kho trung tâm ngoài phân quyền (QT-14)", async () => {
    const service = new StockService();
    const user = { role: "KTV", centerId: 1 };

    await assert.rejects(
      async () => {
        await service.getPartsWithStock(
          { centerId: 2 },
          user // User thuộc trung tâm 1 nhưng xem trung tâm 2
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
