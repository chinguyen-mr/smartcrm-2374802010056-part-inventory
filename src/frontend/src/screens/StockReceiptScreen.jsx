import React, { useState, useEffect } from "react";
import { getParts, receiveStock, getTransactions } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import AlertBanner from "../components/AlertBanner";

export default function StockReceiptScreen({ centerId, role }) {
  const [parts, setParts] = useState([]);
  const [selectedPartId, setSelectedPartId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  // Lịch sử nhập kho gần đây
  const [recentReceipts, setRecentReceipts] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Tải danh mục linh kiện để chọn trong dropdown
  const loadPartsList = async () => {
    try {
      const res = await getParts({ center_id: centerId, page: 1, size: 200 });
      setParts(res.items || []);
      if (res.items && res.items.length > 0 && !selectedPartId) {
        setSelectedPartId(res.items[0].part_id);
      }
    } catch (err) {
      console.error("Lỗi tải danh mục linh kiện:", err);
    }
  };

  // Tải lịch sử nhập kho gần nhất
  const loadRecentReceipts = async () => {
    setLoadingHistory(true);
    try {
      const res = await getTransactions({ center_id: centerId, type: "NHAP", page: 1, size: 5 });
      setRecentReceipts(res.items || []);
    } catch (err) {
      console.error("Lỗi tải lịch sử nhập:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadPartsList();
    loadRecentReceipts();
  }, [centerId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessData(null);

    const parsedQty = Number(quantity);
    if (!parsedQty || parsedQty <= 0) {
      setError("Số lượng nhập kho phải là số nguyên dương lớn hơn 0.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await receiveStock({
        center_id: centerId,
        part_id: selectedPartId,
        quantity: parsedQty,
        reference: reference || undefined,
      });

      setSuccessData(res.data);
      setReference("");
      // Tải lại lịch sử và danh mục tồn
      loadPartsList();
      loadRecentReceipts();
    } catch (err) {
      setError(err.message || "Ghi nhận nhập kho thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">M2 — Ghi nhận Nhập kho Linh kiện (US3, UC3, FR5)</h2>
            <p className="card-desc">
              Tạo giao dịch nhập bổ sung linh kiện tại Trung tâm #{centerId}. Cập nhật số dư tồn kho tức thời.
            </p>
          </div>
        </div>

        {role !== "QUAN_LY_TRUNG_TAM" && (
          <AlertBanner
            type="warning"
            message="Lưu ý phân quyền: Nghiệp vụ nhập kho yêu cầu vai trò Quản lý trung tâm (QLTT). Bạn đang ở chế độ xem KTV, hãy chuyển vai trò ở góc trên để thực hiện thao tác."
          />
        )}

        {error && <AlertBanner type="danger" message={error} onClose={() => setError(null)} />}

        {successData && (
          <AlertBanner
            type="success"
            message={`✓ Ghi nhận nhập kho thành công! Mã giao dịch #${successData.transaction_id}. Số lượng nhập: +${successData.quantity}. Tồn kho mới: ${successData.new_quantity}.`}
            onClose={() => setSuccessData(null)}
          />
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                Trung tâm tiếp nhận <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={`Trung tâm #${centerId}`}
                disabled
                style={{ background: "#f1f5f9" }}
              />
              <div className="form-helper">Theo nguyên tắc QT-14: Thao tác kho gắn với trung tâm được phân quyền.</div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Chọn linh kiện thay thế <span className="required">*</span>
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
                    {p.part_code} — {p.part_name} (Hiện có: {p.quantity || 0})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Số lượng nhập <span className="required">*</span>
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
            </div>

            <div className="form-group">
              <label className="form-label">Mã phiếu nhập / Số chứng từ tham chiếu</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: PN-2026-0008, PO-9912..."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                maxLength={80}
                disabled={submitting}
              />
              <div className="form-helper">Tùy chọn, tối đa 80 ký tự theo API Contract.</div>
            </div>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || parts.length === 0 || role !== "QUAN_LY_TRUNG_TAM"}
            >
              {submitting ? "Đang xử lý nhập kho..." : "📥 Xác nhận Nhập kho (Tăng tồn)"}
            </button>
          </div>
        </form>
      </div>

      {/* Lịch sử giao dịch nhập kho gần nhất */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: "1rem" }}>
          Lịch sử các lần nhập kho gần nhất tại Trung tâm #{centerId}
        </h3>

        {loadingHistory && <LoadingSpinner text="Đang tải lịch sử nhập..." />}

        {!loadingHistory && recentReceipts.length === 0 && (
          <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Chưa có giao dịch nhập kho nào được ghi nhận gần đây.
          </div>
        )}

        {!loadingHistory && recentReceipts.length > 0 && (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã GD</th>
                  <th>Mã LK</th>
                  <th>Tên linh kiện</th>
                  <th>Số lượng</th>
                  <th>Thời điểm ghi nhận</th>
                  <th>Chứng từ tham chiếu</th>
                </tr>
              </thead>
              <tbody>
                {recentReceipts.map((tx) => (
                  <tr key={tx.transaction_id}>
                    <td>#{tx.transaction_id}</td>
                    <td style={{ fontWeight: 600 }}>{tx.part_code}</td>
                    <td>{tx.part_name}</td>
                    <td>
                      <span className="badge badge-success">+{tx.quantity}</span>
                    </td>
                    <td>{new Date(tx.occurred_at).toLocaleString("vi-VN")}</td>
                    <td>{tx.reference || "—"}</td>
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
