import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import StockLookupScreen from "./screens/StockLookupScreen";
import StockReceiptScreen from "./screens/StockReceiptScreen";
import StockIssueScreen from "./screens/StockIssueScreen";
import { loginDemo } from "./api/client";
import AlertBanner from "./components/AlertBanner";

export default function App() {
  const [activeTab, setActiveTab] = useState("M1");
  const [role, setRole] = useState("KTV");
  const [centerId, setCenterId] = useState(1);
  const [authError, setAuthError] = useState(null);
  const [authenticating, setAuthenticating] = useState(false);

  // Khởi tạo phiên làm việc demo cho người chấm / người dùng
  const initAuth = async (currentRole, currentCenterId) => {
    setAuthenticating(true);
    setAuthError(null);
    try {
      await loginDemo({
        role: currentRole,
        center_id: currentCenterId,
        username: currentRole === "KTV" ? `ktv_tt0${currentCenterId}` : `qltt_tt0${currentCenterId}`,
      });
    } catch (err) {
      setAuthError("Không thể kết nối Backend để cấp token xác thực: " + err.message);
    } finally {
      setAuthenticating(false);
    }
  };

  useEffect(() => {
    initAuth(role, centerId);
  }, []);

  const handleRoleOrCenterChange = (newRole, newCenterId) => {
    initAuth(newRole, newCenterId);
  };

  return (
    <div>
      {/* Thanh Header ứng dụng */}
      <Header
        role={role}
        setRole={setRole}
        centerId={centerId}
        setCenterId={setCenterId}
        onRoleOrCenterChange={handleRoleOrCenterChange}
      />

      {/* Thanh điều hướng 3 màn hình cốt lõi theo đề bài BT2 */}
      <div className="nav-tabs">
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === "M1" ? "active" : ""}`}
            onClick={() => setActiveTab("M1")}
          >
            📋 M1 — Tra cứu Tồn & Cảnh báo
          </button>

          <button
            className={`tab-btn ${activeTab === "M2" ? "active" : ""}`}
            onClick={() => setActiveTab("M2")}
          >
            📥 M2 — Ghi nhận Nhập kho
          </button>

          <button
            className={`tab-btn ${activeTab === "M3" ? "active" : ""}`}
            onClick={() => setActiveTab("M3")}
          >
            📤 M3 — Ghi nhận Xuất kho theo Phiếu
          </button>
        </div>
      </div>

      {/* Nội dung màn hình chính */}
      <main className="main-content">
        {authError && <AlertBanner type="danger" message={authError} onClose={() => setAuthError(null)} />}

        {activeTab === "M1" && <StockLookupScreen centerId={centerId} role={role} />}
        {activeTab === "M2" && <StockReceiptScreen centerId={centerId} role={role} />}
        {activeTab === "M3" && <StockIssueScreen centerId={centerId} role={role} />}
      </main>
    </div>
  );
}
