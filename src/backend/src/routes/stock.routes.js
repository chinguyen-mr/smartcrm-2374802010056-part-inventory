const express = require("express");
const router = express.Router();
const stockValidator = require("../validators/stock.validator");
const receiptService = require("../services/receipt.service");
const issueService = require("../services/issue.service");
const stockService = require("../services/stock.service");
const { requireAuth, requireRole } = require("../middleware/auth.middleware");

/**
 * 1. POST /api/stock/receipts - Ghi nhận nhập kho (US3, UC3)
 */
router.post("/receipts", requireAuth, requireRole("QUAN_LY_TRUNG_TAM"), async (req, res, next) => {
  try {
    const input = stockValidator.validateReceiptInput(req.body);
    const result = await receiptService.receiveStock(input, req.user);
    res.status(201).json({
      message: "Ghi nhận nhập kho thành công.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 2. POST /api/stock/issues - Xuất linh kiện cho phiếu bảo hành (US2, UC2)
 */
router.post("/issues", requireAuth, async (req, res, next) => {
  try {
    const input = stockValidator.validateIssueInput(req.body);
    const result = await issueService.issueStock(input, req.user);
    res.status(201).json({
      message: "Xuất kho linh kiện thành công.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 3. GET /api/stock/alerts - Xem danh sách linh kiện dưới ngưỡng cảnh báo (US4, UC5)
 */
router.get("/alerts", requireAuth, async (req, res, next) => {
  try {
    const centerId = req.query.center_id ? Number(req.query.center_id) : (req.user ? req.user.centerId : 1);
    const page = req.query.page ? Math.max(1, parseInt(req.query.page, 10)) : 1;
    const size = req.query.size ? Math.min(100, Math.max(1, parseInt(req.query.size, 10))) : 20;

    const result = await stockService.getStockAlerts({ centerId, page, size }, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * 4. PUT /api/stock/thresholds - Thiết lập ngưỡng cảnh báo (US5, UC6)
 */
router.put("/thresholds", requireAuth, requireRole("QUAN_LY_TRUNG_TAM"), async (req, res, next) => {
  try {
    const input = stockValidator.validateThresholdInput(req.body);
    const result = await stockService.setThreshold(input, req.user);
    res.json({
      message: "Cập nhật ngưỡng cảnh báo thành công.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 5. GET /api/stock/transactions - Xem lịch sử biến động kho (US6, UC7)
 */
router.get("/transactions", requireAuth, async (req, res, next) => {
  try {
    const centerId = req.query.center_id ? Number(req.query.center_id) : (req.user ? req.user.centerId : 1);
    const partId = req.query.part_id ? Number(req.query.part_id) : undefined;
    const type = req.query.type ? String(req.query.type).toUpperCase() : undefined;
    const from = req.query.from ? String(req.query.from).trim() : undefined;
    const to = req.query.to ? String(req.query.to).trim() : undefined;
    const page = req.query.page ? Math.max(1, parseInt(req.query.page, 10)) : 1;
    const size = req.query.size ? Math.min(100, Math.max(1, parseInt(req.query.size, 10))) : 20;

    const result = await stockService.getTransactions(
      { centerId, partId, type, from, to, page, size },
      req.user
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
