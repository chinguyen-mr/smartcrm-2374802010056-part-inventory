const ticketRepository = require("../repositories/ticket.repository");
const AppError = require("../errors/AppError");

// Allowlist các trạng thái phiếu được phép xuất linh kiện theo đề xuất thiết kế BT2
const ALLOWED_TICKET_STATUSES = ["DA_PHAN_CONG", "DANG_XU_LY", "CHO_LINH_KIEN"];

/**
 * Adapter tích hợp hệ thống phiếu bảo hành ngoài
 * Đóng vai trò ranh giới tích hợp (Integration Boundary) theo sơ đồ kiến trúc BT1
 */
class TicketAdapter {
  /**
   * Xác minh mã phiếu, trung tâm và trạng thái phiếu trước khi xuất kho
   */
  async verifyTicketForIssue(ticketCode, centerId, client = null) {
    if (!ticketCode || typeof ticketCode !== "string" || !ticketCode.trim()) {
      throw new AppError(
        "DU_LIEU_KHONG_HOP_LE",
        "Mã phiếu bảo hành không được để trống.",
        400,
        { field: "ticket_code" }
      );
    }

    const ticket = await ticketRepository.findByCode(ticketCode.trim(), client);

    if (!ticket) {
      throw new AppError(
        "TICKET_NOT_FOUND",
        `Không tìm thấy phiếu bảo hành với mã ${ticketCode} trong hệ thống.`,
        404,
        { ticket_code: ticketCode }
      );
    }

    // Kiểm tra trung tâm xử lý phiếu có khớp với trung tâm xuất kho không
    if (Number(ticket.center_id) !== Number(centerId)) {
      throw new AppError(
        "TICKET_CENTER_MISMATCH",
        `Phiếu bảo hành ${ticketCode} thuộc trung tâm #${ticket.center_id}, không khớp với trung tâm #${centerId} đang thao tác.`,
        409,
        { ticket_center_id: ticket.center_id, current_center_id: centerId }
      );
    }

    // Kiểm tra trạng thái phiếu có nằm trong danh sách cho phép xuất không
    if (!ALLOWED_TICKET_STATUSES.includes(ticket.status)) {
      throw new AppError(
        "TICKET_STATUS_NOT_ELIGIBLE",
        `Phiếu bảo hành ${ticketCode} đang ở trạng thái '${ticket.status}', không thuộc diện được phép xuất linh kiện.`,
        409,
        {
          current_status: ticket.status,
          allowed_statuses: ALLOWED_TICKET_STATUSES,
        }
      );
    }

    return ticket;
  }
}

module.exports = new TicketAdapter();
