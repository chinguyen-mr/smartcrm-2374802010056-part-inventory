import React from "react";

export default function AlertBanner({ type = "danger", message, details, onClose, onRetry }) {
  if (!message) return null;

  return (
    <div className={`alert alert-${type}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>{message}</div>
        {details && (
          <div style={{ marginTop: "0.25rem", fontSize: "0.85rem", opacity: 0.9 }}>
            {typeof details === "string" ? details : JSON.stringify(details)}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="btn btn-sm"
            style={{
              padding: "0.25rem 0.6rem",
              fontSize: "0.85rem",
              background: "rgba(255,255,255,0.2)",
              border: "1px solid currentColor",
              color: "inherit",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            🔄 Thử lại
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.2rem",
              cursor: "pointer",
              color: "inherit",
              opacity: 0.8,
              lineHeight: 1,
              padding: "0 0.25rem"
            }}
            title="Đóng thông báo"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
