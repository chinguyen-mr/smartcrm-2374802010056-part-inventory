import React from "react";

export default function LoadingSpinner({ text = "Đang tải dữ liệu từ máy chủ..." }) {
  return (
    <div className="spinner-container">
      <div className="spinner"></div>
      <div>{text}</div>
    </div>
  );
}
