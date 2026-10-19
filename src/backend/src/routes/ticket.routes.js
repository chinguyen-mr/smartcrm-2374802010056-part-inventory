const express = require("express");
const router = express.Router();
const stockService = require("../services/stock.service");
const { requireAuth } = require("../middleware/auth.middleware");

/**
 * GET /api/tickets/:ticket_code/parts - Xem danh sách linh kiện đã xuất theo mã phiếu bảo hành (US7, UC8)
 */
router.get("/:ticket_code/parts", requireAuth, async (req, res, next) => {
  try {
    const ticketCode = req.params.ticket_code;
    const centerId = req.query.center_id ? Number(req.query.center_id) : (req.user ? req.user.centerId : 1);

    const result = await stockService.getPartsIssuedForTicket(
      { ticketCode, centerId },
      req.user
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
