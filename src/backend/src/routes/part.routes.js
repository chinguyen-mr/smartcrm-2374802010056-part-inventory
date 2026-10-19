const express = require("express");
const router = express.Router();
const partService = require("../services/part.service");
const stockService = require("../services/stock.service");
const { requireAuth, requireRole } = require("../middleware/auth.middleware");

/**
 * 1. GET /api/parts - Tra cứu danh mục linh kiện kèm số lượng tồn và ngưỡng tại trung tâm (US1, UC1)
 */
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const centerId = req.query.center_id ? Number(req.query.center_id) : (req.user ? req.user.centerId : 1);
    const q = req.query.q ? String(req.query.q).trim() : undefined;
    const page = req.query.page ? Math.max(1, parseInt(req.query.page, 10)) : 1;
    const size = req.query.size ? Math.min(100, Math.max(1, parseInt(req.query.size, 10))) : 20;

    const result = await stockService.getPartsWithStock(
      { centerId, q, belowThresholdOnly: false, page, size },
      req.user
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * 2. GET /api/parts/:id - Xem chi tiết linh kiện
 */
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const partId = Number(req.params.id);
    const part = await partService.getPartById(partId);
    res.json({ data: part });
  } catch (error) {
    next(error);
  }
});

/**
 * 3. POST /api/parts - Thêm mới linh kiện vào danh mục (QLTT)
 */
router.post("/", requireAuth, requireRole("QUAN_LY_TRUNG_TAM"), async (req, res, next) => {
  try {
    const created = await partService.createPart(req.body, req.user);
    res.status(201).json({
      message: "Thêm linh kiện thành công.",
      data: created,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 4. PUT /api/parts/:id - Cập nhật thông tin linh kiện (QLTT)
 */
router.put("/:id", requireAuth, requireRole("QUAN_LY_TRUNG_TAM"), async (req, res, next) => {
  try {
    const partId = Number(req.params.id);
    const updated = await partService.updatePart(partId, req.body, req.user);
    res.json({
      message: "Cập nhật linh kiện thành công.",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 5. DELETE /api/parts/:id - Xóa linh kiện khỏi danh mục (QLTT)
 */
router.delete("/:id", requireAuth, requireRole("QUAN_LY_TRUNG_TAM"), async (req, res, next) => {
  try {
    const partId = Number(req.params.id);
    await partService.deletePart(partId, req.user);
    res.json({
      message: `Đã xóa linh kiện #${partId} thành công.`,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
