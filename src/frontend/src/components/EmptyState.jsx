import React from "react";

export default function EmptyState({ title = "Không có dữ liệu", message = "Chưa có bản ghi nào phù hợp với bộ lọc hiện tại." }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">📦</div>
      <div className="empty-title">{title}</div>
      <div className="empty-text">{message}</div>
    </div>
  );
}
