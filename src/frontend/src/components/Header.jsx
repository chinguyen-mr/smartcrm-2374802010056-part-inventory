import React from "react";

const CENTERS = [
  { id: 1, code: "TT01", name: "TTBH Quận 10 (TP.HCM)" },
  { id: 2, code: "TT02", name: "TTBH Tân Bình (TP.HCM)" },
  { id: 3, code: "TT03", name: "TTBH TP. Thủ Đức" },
  { id: 4, code: "TT04", name: "TTBH Ninh Kiều (Cần Thơ)" },
  { id: 5, code: "TT05", name: "TTBH Hải Châu (Đà Nẵng)" },
  { id: 6, code: "TT06", name: "TTBH Cầu Giấy (Hà Nội)" },
];

export default function Header({ role, centerId, onRoleOrCenterChange }) {
  const handleRoleChange = (e) => {
    onRoleOrCenterChange(e.target.value, centerId);
  };

  const handleCenterChange = (e) => {
    onRoleOrCenterChange(role, Number(e.target.value));
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="brand">
          <span className="brand-badge">L5</span>
          <div>
            <div className="brand-title">Smart CRM — Kho Linh Kiện</div>
            <div className="brand-subtitle">Mekong Mobile • Hệ thống Quản lý Tồn kho & Cảnh báo</div>
          </div>
        </div>

        <div className="user-controls">
          <div className="control-pill">
            <span>👤 Vai trò:</span>
            <select className="select-control" value={role} onChange={handleRoleChange}>
              <option value="KTV">Kỹ thuật viên (KTV)</option>
              <option value="QUAN_LY_TRUNG_TAM">Quản lý trung tâm (QLTT)</option>
            </select>
          </div>

          <div className="control-pill">
            <span>🏢 Trung tâm:</span>
            <select className="select-control" value={centerId} onChange={handleCenterChange}>
              {CENTERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
