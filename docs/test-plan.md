# Kế hoạch kiểm thử (Test Plan) — Phân hệ Quản lý kho linh kiện thay thế (Luồng L5)

**Học phần:** Chuyên đề Tốt nghiệp 1 — Chuyên ngành: Kỹ thuật Phần mềm (Track SE)  
**Dự án:** Smart CRM – Mekong Mobile  
**Phân hệ:** Luồng L5 – Quản lý kho linh kiện thay thế (Part Inventory Management)  
**Sinh viên thực hiện:** Nguyễn Văn Chí (MSSV: 2374802010056)  
**Phiên bản kế hoạch:** v1.1 — Bám sát yêu cầu kiểm thử Buổi 7, Buổi 11 và Buổi 14  

---

## 1. Mục tiêu kiểm thử (Test Objectives)

Kế hoạch kiểm thử này được thiết lập nhằm đạt được các mục tiêu kỹ thuật cụ thể:
1. **Kiểm chứng tính đúng đắn của 3 quy tắc nghiệp vụ bất biến:**
   - **QT-09 (Khóa bi quan & Cảnh báo tồn kho):** Ngăn chặn xuất vượt tồn kho khả dụng bằng cơ chế khóa bi quan dòng (`SELECT ... FOR UPDATE`), loại bỏ hiện tượng Race Condition; kiểm chứng công thức cảnh báo thiếu hụt nghiêm ngặt `quantity < min_threshold` (khi bằng ngưỡng xem là an toàn).
   - **QT-13 (Sổ cái giao dịch bất biến):** Mọi giao dịch nhập (`NHAP`) và xuất (`XUAT`) đều tự động ghi vào bảng `part_transaction`; bảo đảm tính Append-Only không sửa/xóa.
   - **QT-14 (Phân quyền đa trung tâm & Vai trò):** Cô lập dữ liệu giữa 6 trung tâm dịch vụ; tài khoản thuộc trung tâm nào chỉ được đọc/ghi dữ liệu kho của trung tâm đó; phân quyền chỉ Quản lý trung tâm mới được cập nhật ngưỡng cảnh báo.
2. **Bảo đảm bao phủ đầy đủ 5 loại kiểm thử chuẩn:**
   - Luồng đúng (Positive Path)
   - Giá trị biên (Boundary Cases)
   - Dữ liệu sai & từ chối an toàn (Negative / Invalid Input)
   - Bảo mật & Phân quyền (Security / Multi-tenancy / Data Quality)
   - Tái lập hệ thống & Tính bất biến (Reproducibility & Idempotency)
3. **Tiêu chí tự động hóa cao nhất:** Toàn bộ bộ kiểm thử thực thi chỉ bằng **một câu lệnh duy nhất** (`npm test`), độc lập với môi trường phát triển cá nhân.

---

## 2. Phạm vi kiểm thử (Test Scope)

### 2.1. Các chức năng nằm trong phạm vi kiểm thử (In-Scope):
- **Chức năng M1 — Tra cứu tồn kho & Cảnh báo thiếu hụt (US1, US4, US5; UC1; FR1, FR7, FR8):**
  - Tra cứu danh mục linh kiện và số lượng tồn theo từng trung tâm dịch vụ.
  - Lọc linh kiện đang bị thiếu hụt theo điều kiện `quantity < min_threshold`.
  - Thiết lập ngưỡng cảnh báo tồn tối thiểu `min_threshold` bởi Quản lý trung tâm.
- **Chức năng M2 — Ghi nhận nhập kho linh kiện (US3; UC3; FR5):**
  - Nhập bổ sung số lượng cho linh kiện đã có trong kho trung tâm.
  - Tự động khởi tạo dòng tồn mới khi linh kiện chưa từng có tồn tại trung tâm.
  - Tự động ghi nhận giao dịch loại `NHAP` vào bảng `part_transaction`.
- **Chức năng M3 — Ghi nhận xuất kho theo phiếu bảo hành (US2; UC2; FR2, FR3, FR4, FR11):**
  - Xác minh tính hợp lệ và trạng thái phiếu bảo hành (`DANG_XU_LY`, `CHO_LINH_KIEN`, `DA_PHAN_CONG`).
  - Khóa dòng dữ liệu tồn kho bằng `SELECT ... FOR UPDATE`.
  - Trừ tồn kho nguyên tử và tạo bản ghi xuất kho loại `XUAT`.
  - Từ chối an toàn khi số lượng yêu cầu vượt tồn hoặc phiếu không hợp lệ.

### 2.2. Các nội dung ngoài phạm vi (Out-of-Scope):
- Khởi tạo mới phiếu bảo hành hoặc thay đổi trạng thái phiếu (thuộc hệ thống bảo hành ngoài).
- Quản lý thanh toán hóa đơn khách hàng (thuộc phân hệ tài chính/kế toán).

---

## 3. Chiến lược và Phân loại 5 nhóm kiểm thử (5 Test Categories)

| Nhóm kiểm thử | Mục đích | Số lượng ca test | Phạm vi áp dụng |
|:---|:---|:---:|:---|
| **1. Luồng đúng (Positive)** | Xác minh hệ thống xử lý chính xác khi đầu vào hợp lệ, phiếu đúng quy cách, đủ số dư tồn kho. | 8 tests | Unit Tests & API Integration |
| **2. Giá trị biên (Boundary)** | Kiểm chứng hành vi tại các điểm mút giá trị: số lượng tồn về đúng 0, tồn bằng đúng ngưỡng (`quantity == min_threshold`), nhập tối thiểu = 1, ngưỡng min = 0. | 5 tests | Unit Tests (Service Layer) |
| **3. Dữ liệu sai (Negative)** | Kiểm chứng khả năng từ chối an toàn khi gặp dữ liệu không hợp lệ: số âm, số lượng bằng 0, xuất vượt tồn khả dụng, phiếu sai trạng thái / đã đóng. | 9 tests | Unit Tests & API Integration |
| **4. Bảo mật / Phân quyền (Security / Data Quality)** | Kiểm tra phân quyền đa trung tâm QT-14 (truy cập chéo trung tâm bị từ chối 403), kiểm soát vai trò (KTV không được sửa ngưỡng), toàn vẹn sổ cái giao dịch bất biến QT-13. | 5 tests | Unit Tests & API Integration |
| **5. Tái lập & Bất biến (Reproducibility / Idempotent)** | Kiểm chứng tính độc lập môi trường: Migration tạo sạch 7 bảng, Seed nạp >17.000 dòng dữ liệu, chạy lại Seed lần 2 sinh 0 bản ghi mới, Frontend build độc lập. | 4 kịch bản | CLI Migration, Seed, Build |

---

## 4. Môi trường và Công cụ kiểm thử (Test Environment & Tools)

- **Test Runner:** Node.js native test runner (`node --test`), thực thi nhanh chóng, không phụ thuộc framework bên ngoài.
- **Thư viện Assert:** `node:assert/strict` bảo đảm tính nghiêm ngặt tuyệt đối trong so sánh kết quả.
- **Cơ sở dữ liệu kiểm thử:** PostgreSQL 16 (chạy containerized hoặc local) chứa 7 bảng CSDL chuẩn hóa.
- **Tầng cô lập kiểm thử (Unit Test):** Sử dụng kỹ thuật Mock Repository để kiểm thử 100% logic nghiệp vụ của tầng Service mà không cần phụ thuộc vào kết nối CSDL thật.
- **Tầng kiểm thử tích hợp (Integration Test):** Gọi trực tiếp REST API qua giao thức HTTP nội bộ tới Express server và CSDL PostgreSQL thật với các kịch bản E2E.

---

## 5. Tiêu chí nghiệm thu (Acceptance Criteria)

1. **Tỷ lệ Pass:** 100% ca kiểm thử đạt kết quả PASS (31/31 ca test tự động).
2. **Thời gian thực thi:** Toàn bộ bộ kiểm thử hoàn thành trong dưới 15 giây.
3. **Thao tác đơn giản:** Thực thi toàn bộ kiểm thử bằng một lệnh duy nhất từ thư mục gốc:
   ```bash
   npm test
   ```
4. **Không phụ thuộc dữ liệu ngầm:** Hệ thống có thể chạy `npm run migrate` và `npm run seed` để thiết lập lại dữ liệu sạch từ đầu bất kỳ lúc nào.

