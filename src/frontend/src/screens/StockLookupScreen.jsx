import React, { useState, useEffect } from "react";
import { getParts, getStockAlerts, setThreshold } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import AlertBanner from "../components/AlertBanner";

export default function StockLookupScreen({ centerId, role }) {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBelowThreshold, setFilterBelowThreshold] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Modal / form cấu hình ngưỡng
  const [editingPart, setEditingPart] = useState(null);
  const [newThreshold, setNewThreshold] = useState(0);
  const [savingThreshold, setSavingThreshold] = useState(false);

  const fetchStockData = async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (filterBelowThreshold) {
        res = await getStockAlerts({ center_id: centerId, page: 1, size: 50 });
      } else {
        res = await getParts({ center_id: centerId, q: searchQuery, page: 1, size: 50 });
      }
      setParts(res.items || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách tồn kho.");
      setParts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, [centerId, filterBelowThreshold]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStockData();
  };

  const handleOpenThresholdModal = (part) => {
    setEditingPart(part);
    setNewThreshold(part.min_threshold || 0);
    setError(null);
    setSuccessMsg(null);
  };

  const handleSaveThreshold = async (e) => {
    e.preventDefault();
    if (!editingPart) return;

    setSavingThreshold(true);
    setError(null);
    try {
      const res = await setThreshold({
        center_id: centerId,
        part_id: editingPart.part_id,
        min_threshold: newThreshold,
      });
      setSuccessMsg(`Đã cập nhật ngưỡng cảnh báo cho linh kiện ${editingPart.part_code} thành ${newThreshold}.`);
      setEditingPart(null);
      fetchStockData();
    } catch (err) {
      setError(err.message || "Không thể cập nhật ngưỡng cảnh báo.");
    } finally {
      setSavingThreshold(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">M1 — Tra cứu Tồn kho & Cảnh báo (US1, US4, US5)</h2>
            <p className="card-desc">
              Theo dõi tồn kho thực tế tại Trung tâm #{centerId}. Hệ thống tự động cảnh báo khi Tồn &lt; Ngưỡng.
            </p>
          </div>
          <div>
            <button
              className={`btn btn-sm ${filterBelowThreshold ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilterBelowThreshold(!filterBelowThreshold)}
            >
              {filterBelowThreshold ? "← Xem tất cả linh kiện" : "⚠️ Lọc linh kiện Dưới ngưỡng"}
            </button>
          </div>
        </div>

        {error && <AlertBanner type="danger" message={error} onRetry={fetchStockData} onClose={() => setError(null)} />}
        {successMsg && <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg(null)} />}

        {/* Thanh tìm kiếm */}
        <form onSubmit={handleSearchSubmit} className="search-bar">
          <input
            type="text"
            className="form-input search-input"
            placeholder="Tìm theo mã linh kiện (VD: MH-SS-01) hoặc tên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={filterBelowThreshold}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || filterBelowThreshold}>
            🔍 Tìm kiếm
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setSearchQuery("");
              setFilterBelowThreshold(false);
              fetchStockData();
            }}
          >
            Làm mới
          </button>
        </form>

        {/* Trạng thái Loading */}
        {loading && <LoadingSpinner text="Đang tra cứu tồn kho theo trung tâm..." />}

        {/* Trạng thái Empty */}
        {!loading && parts.length === 0 && (
          <EmptyState
            title="Không tìm thấy linh kiện"
            message={
              filterBelowThreshold
                ? "Tuyệt vời! Hiện không có linh kiện nào bị dưới ngưỡng cảnh báo tại trung tâm này."
                : "Không có linh kiện nào khớp với từ khóa tìm kiếm."
            }
          />
        )}

        {/* Bảng dữ liệu tồn kho */}
        {!loading && parts.length > 0 && (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã LK</th>
                  <th>Tên linh kiện</th>
                  <th>Đơn giá</th>
                  <th>Số lượng tồn</th>
                  <th>Ngưỡng tối thiểu</th>
                  <th>Trạng thái tồn</th>
                  {role === "QUAN_LY_TRUNG_TAM" && <th>Thao tác (QLTT)</th>}
                </tr>
              </thead>
              <tbody>
                {parts.map((p) => {
                  const qty = Number(p.quantity || 0);
                  const minTh = Number(p.min_threshold || 0);
                  const isBelow = p.is_below_threshold || (qty < minTh && minTh > 0);

                  return (
                    <tr key={p.part_id}>
                      <td style={{ fontWeight: 600 }}>{p.part_code}</td>
                      <td>{p.part_name}</td>
                      <td>{Number(p.unit_price).toLocaleString("vi-VN")} đ</td>
                      <td>
                        <span style={{ fontSize: "1.05rem", fontWeight: 700, color: qty === 0 ? "#ef4444" : "inherit" }}>
                          {qty}
                        </span>
                      </td>
                      <td>{minTh}</td>
                      <td>
                        {isBelow ? (
                          <span className="badge badge-danger">⚠️ DƯỚI NGƯỠNG ({qty}/{minTh})</span>
                        ) : minTh === 0 ? (
                          <span className="badge badge-neutral">Chưa đặt ngưỡng</span>
                        ) : (
                          <span className="badge badge-success">✓ An toàn ({qty})</span>
                        )}
                      </td>
                      {role === "QUAN_LY_TRUNG_TAM" && (
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenThresholdModal(p)}
                          >
                            ⚙️ Đặt ngưỡng
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal / Form đặt ngưỡng */}
      {editingPart && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "1rem",
          }}
        >
          <div className="card" style={{ maxWidth: 450, width: "100%", margin: 0 }}>
            <h3 className="card-title">Thiết lập Ngưỡng cảnh báo (FR8)</h3>
            <p className="card-desc" style={{ marginBottom: "1rem" }}>
              Linh kiện: <strong>{editingPart.part_code}</strong> — {editingPart.part_name}
            </p>

            <form onSubmit={handleSaveThreshold}>
              <div className="form-group">
                <label className="form-label">
                  Ngưỡng cảnh báo tối thiểu (min_threshold) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="form-input"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  required
                />
                <div className="form-helper">
                  Quy tắc QT-09: Cảnh báo kích hoạt khi Tồn &lt; Ngưỡng. Nhập 0 = Tắt cảnh báo theo ngưỡng.
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingPart(null)}
                  disabled={savingThreshold}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingThreshold}>
                  {savingThreshold ? "Đang lưu..." : "Lưu cấu hình"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
