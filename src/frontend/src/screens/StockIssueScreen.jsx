import React, { useState, useEffect } from "react";
import { getParts, issueStock, getPartsIssuedForTicket } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import AlertBanner from "../components/AlertBanner";

export default function StockIssueScreen({ centerId, role }) {
  const [parts, setParts] = useState([]);
  const [ticketCode, setTicketCode] = useState("BH-TEST-ACTIVE-01");
  const [selectedPartId, setSelectedPartId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  // Tab tra cứu linh kiện theo phiếu
  const [searchTicketCode, setSearchTicketCode] = useState("BH-TEST-ACTIVE-01");
  const [ticketIssuedParts, setTicketIssuedParts] = useState([]);
  const [loadingTicketParts, setLoadingTicketParts] = useState(false);
  const [ticketPartsError, setTicketPartsError] = useState(null);

  const loadPartsList = async () => {
    try {
      const res = await getParts({ center_id: centerId, page: 1, size: 200 });
      setParts(res.items || []);
      if (res.items && res.items.length > 0 && !selectedPartId) {
        setSelectedPartId(res.items[0].part_id);
      }
    } catch (err) {
      console.error("Lỗi tải danh mục:", err);
    }
  };

  const handleQueryTicketParts = async (e) => {
    if (e) e.preventDefault();
    if (!searchTicketCode.trim()) return;

    setLoadingTicketParts(true);
    setTicketPartsError(null);
    try {
      const res = await getPartsIssuedForTicket({
        ticket_code: searchTicketCode.trim(),
        center_id: centerId,
      });
      setTicketIssuedParts(res.items || []);
    } catch (err) {
      setTicketPartsError(err.message || "Không thể tra cứu linh kiện đã xuất cho phiếu này.");
      setTicketIssuedParts([]);
    } finally {
      setLoadingTicketParts(false);
    }
  };

  useEffect(() => {
    loadPartsList();
  }, [centerId]);

  const selectedPart = parts.find((p) => p.part_id === Number(selectedPartId));

  const handleSubmitIssue = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessData(null);

    if (!ticketCode.trim()) {
      setError("Vui lòng nhập mã phiếu bảo hành hợp lệ.");
      return;
    }

    const parsedQty = Number(quantity);
    if (!parsedQty || parsedQty <= 0) {
      setError("Số lượng xuất kho phải là số nguyên dương lớn hơn 0.");
      return;
    }

    if (selectedPart && parsedQty > Number(selectedPart.quantity || 0)) {
      setError(
        `Quy tắc QT-09: Tồn kho hiện tại (${selectedPart.quantity || 0}) không đủ để xuất ${parsedQty} chiếc. Vui lòng kiểm tra lại.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await issueStock({
        center_id: centerId,
        part_id: Number(selectedPartId),
        ticket_code: ticketCode.trim(),
        quantity: parsedQty,
      });

      setSuccessData(res.data);
      // Tải lại danh sách tồn để cập nhật số lượng mới nhất
      await loadPartsList();
      // Nếu đang mở tra cứu đúng phiếu đó thì cập nhật luôn
      if (searchTicketCode === ticketCode.trim()) {
        handleQueryTicketParts();
      }
    } catch (err) {
      setError(err.message || "Ghi nhận xuất kho thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Khối Form xuất kho */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">M3 — Ghi nhận Xuất kho cho Phiếu Bảo hành (US2, UC2, FR2, FR3, FR4)</h2>
            <p className="card-desc">
              KTV xuất linh kiện cho phiếu sửa chữa hợp lệ. Xác minh trạng thái phiếu, khóa tồn và cập nhật nguyên tử.
            </p>
          </div>
        </div>

        {error && (
          <AlertBanner
            type="danger"
            message={error}
            onRetry={() => {
              setError(null);
              loadPartsList();
            }}
            onClose={() => setError(null)}
          />
        )}

        {successData && (
          <AlertBanner
            type="success"
            message={`✓ Xuất kho thành công cho phiếu [${successData.ticket_code}]! Mã GD: #${successData.transaction_id}. Số lượng xuất: -${successData.quantity}. Tồn còn lại: ${successData.new_quantity}. ${
              successData.is_below_threshold
                ? "⚠️ CẢNH BÁO: Tồn kho đã giảm xuống dưới ngưỡng tối thiểu!"
                : ""
            }`}
            onClose={() => setSuccessData(null)}
          />
        )}

        <form onSubmit={handleSubmitIssue}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                Mã phiếu bảo hành (ticket_code) <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: BH-TEST-ACTIVE-01"
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value)}
                disabled={submitting}
                required
              />
              <div className="form-helper">
                Phiếu mẫu test: <code>BH-TEST-ACTIVE-01</code> (hợp lệ), <code>BH-TEST-INVALID-01</code> (đã đóng).
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Chọn linh kiện cần xuất <span className="required">*</span>
              </label>
              <select
                className="form-select"
                value={selectedPartId}
                onChange={(e) => setSelectedPartId(Number(e.target.value))}
                disabled={submitting || parts.length === 0}
                required
              >
                {parts.map((p) => (
                  <option key={p.part_id} value={p.part_id}>
                    {p.part_code} — {p.part_name} (Tồn: {p.quantity || 0} / Ngưỡng: {p.min_threshold || 0})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Số lượng xuất <span className="required">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                className="form-input"
                placeholder="Nhập số lượng > 0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={submitting}
                required
              />
              {selectedPart && (
                <div className="form-helper">
                  Tồn khả dụng tại TT#{centerId}: <strong>{selectedPart.quantity || 0}</strong> chiếc.
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Trung tâm thực hiện</label>
              <input
                type="text"
                className="form-input"
                value={`Trung tâm #${centerId}`}
                disabled
                style={{ background: "#f1f5f9" }}
              />
              <div className="form-helper">Giao dịch được ghi nhận bất biến theo QT-13.</div>
            </div>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || parts.length === 0}
            >
              {submitting ? "Đang xác thực phiếu & kiểm tra tồn..." : "📤 Xác nhận Xuất kho"}
            </button>
          </div>
        </form>
      </div>

      {/* Khối Tra cứu linh kiện đã xuất theo mã phiếu bảo hành (US7, UC8, FR11) */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Tra cứu Linh kiện đã xuất cho Phiếu bảo hành (US7, UC8, FR11)</h3>
            <p className="card-desc">Kiểm tra lịch sử các linh kiện kỹ thuật viên đã xuất phục vụ sửa chữa cho phiếu.</p>
          </div>
        </div>

        <form onSubmit={handleQueryTicketParts} className="search-bar">
          <input
            type="text"
            className="form-input search-input"
            placeholder="Nhập mã phiếu bảo hành cần tra cứu (VD: BH-TEST-ACTIVE-01)..."
            value={searchTicketCode}
            onChange={(e) => setSearchTicketCode(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary" disabled={loadingTicketParts}>
            🔍 Tra cứu phiếu
          </button>
        </form>

        {ticketPartsError && <AlertBanner type="danger" message={ticketPartsError} />}

        {loadingTicketParts && <LoadingSpinner text="Đang tra cứu các linh kiện đã xuất cho phiếu..." />}

        {!loadingTicketParts && ticketIssuedParts.length === 0 && !ticketPartsError && (
          <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", padding: "1rem 0" }}>
            Chưa có linh kiện nào được xuất cho phiếu <strong>{searchTicketCode}</strong> tại trung tâm này.
          </div>
        )}

        {!loadingTicketParts && ticketIssuedParts.length > 0 && (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã GD</th>
                  <th>Mã phiếu</th>
                  <th>Mã LK</th>
                  <th>Tên linh kiện</th>
                  <th>Đơn giá</th>
                  <th>Số lượng xuất</th>
                  <th>Thời điểm xuất</th>
                </tr>
              </thead>
              <tbody>
                {ticketIssuedParts.map((item) => (
                  <tr key={item.transaction_id}>
                    <td>#{item.transaction_id}</td>
                    <td style={{ fontWeight: 600 }}>{item.ticket_code}</td>
                    <td>{item.part_code}</td>
                    <td>{item.part_name}</td>
                    <td>{Number(item.unit_price).toLocaleString("vi-VN")} đ</td>
                    <td>
                      <span className="badge badge-warning">-{item.quantity}</span>
                    </td>
                    <td>{new Date(item.occurred_at).toLocaleString("vi-VN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
