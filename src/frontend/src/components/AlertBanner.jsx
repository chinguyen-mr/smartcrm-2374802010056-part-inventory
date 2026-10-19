import React from "react";

export default function AlertBanner({ type = "danger", message, details, onClose }) {
  if (!message) return null;

  return (
    <div className={`alert alert-${type}`}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>{message}</div>
        {details && (
          <div style={{ marginTop: "0.25rem", fontSize: "0.85rem", opacity: 0.9 }}>
            {typeof details === "string" ? details : JSON.stringify(details)}
          </div>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: "1.1rem",
            cursor: "pointer",
            color: "inherit",
            opacity: 0.7,
          }}
          title="Đóng thông báo"
        >
          ×
        </button>
      )}
    </div>
  );
}
