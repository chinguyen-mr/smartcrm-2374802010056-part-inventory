const express = require("express");
const router = express.Router();
const { generateToken } = require("../middleware/auth.middleware");

/**
 * Endpoint sinh token mẫu phục vụ kiểm thử prototype (Slide 20, 21)
 * Không phụ thuộc vào hệ thống xác thực ngoài
 */
router.post("/token", (req, res) => {
  const { role = "KTV", center_id = 1, username = "test_user" } = req.body || {};

  const validRoles = ["KTV", "QUAN_LY_TRUNG_TAM"];
  const chosenRole = validRoles.includes(role) ? role : "KTV";
  const chosenCenterId = Number(center_id) || 1;

  const token = generateToken({
    userId: 999,
    username,
    role: chosenRole,
    centerId: chosenCenterId,
  });

  res.json({
    message: "Sinh token kiểm thử thành công",
    token,
    user: {
      username,
      role: chosenRole,
      centerId: chosenCenterId,
    },
  });
});

module.exports = router;
