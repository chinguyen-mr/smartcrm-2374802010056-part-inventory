# Kế hoạch kiểm thử (Test Plan) — Phân hệ Quản lý kho linh kiện thay thế (Luồng L5)

**Học phần:** Chuyên đề Tốt nghiệp 1 — Track SE (Kỹ thuật Phần mềm)  
**Dự án:** Smart CRM – Mekong Mobile  
**Phân hệ:** Luồng L5 – Quản lý kho linh kiện thay thế (Part Inventory Management)  
**Sinh viên thực hiện:** Nguyễn Văn Chí (MSSV: 2374802010056)  
**Giai đoạn:** Buổi 14 (Kiểm thử thực nghiệm chuẩn bị cho Bài tập 3)  

---

## 1. Phạm vi kiểm thử (Scope)

- **Các thành phần kiểm tra (In-Scope):**
  - **Ba chức năng cốt lõi luồng L5:**
    - `M1`: Tra cứu tồn kho theo trung tâm và tự động lọc danh sách dưới ngưỡng cảnh báo.
    - `M2`: Ghi nhận nhập kho linh kiện từ nhà cung cấp/tổng kho kèm chứng từ tham chiếu.
    - `M3`: Ghi nhận xuất kho linh kiện phục vụ sửa chữa theo phiếu bảo hành hợp lệ.
  - **Ba quy tắc nghiệp vụ bất biến:**
    - `QT-09 (Khóa bi quan & Cảnh báo thiếu hụt)`: Khóa dòng dữ liệu tồn kho bằng `SELECT ... FOR UPDATE` chống xuất vượt tồn khả dụng và chống Race Condition; công thức cảnh báo thiếu hụt nghiêm ngặt `quantity < min_threshold` (tồn bằng đúng ngưỡng xem là an toàn).
    - `QT-13 (Sổ cái giao dịch bất biến)`: Mọi thao tác nhập (`NHAP`) và xuất (`XUAT`) đều tự động ghi vào bảng `part_transaction`; áp dụng nguyên tắc Append-Only, tuyệt đối không có API hoặc câu lệnh SQL cho phép `UPDATE` hay `DELETE`.
    - `QT-14 (Phân quyền đa trung tâm & Vai trò)`: Cô lập dữ liệu giữa 6 trung tâm dịch vụ (tài khoản trung tâm nào chỉ thao tác trên kho trung tâm đó); phân quyền chỉ Quản lý trung tâm (QLTT) mới được thiết lập ngưỡng cảnh báo, Kỹ thuật viên (KTV) bị chặn 403.
- **Các thành phần chủ ý không kiểm tra (Out-of-Scope & Lý do):**
  - *Cơ chế đăng nhập và mã hóa mật khẩu người dùng thật:* Phân hệ đang dùng endpoint nội bộ `/api/auth/token` sinh JWT token phục vụ kiểm thử độc lập luồng L5 theo đúng phạm vi thiết kế prototype.
  - *Vòng đời tạo mới và cập nhật trạng thái phiếu bảo hành:* Thuộc phân hệ Quản lý bảo hành bên ngoài; L5 chỉ đọc và kiểm tra đối chiếu dữ liệu trên bảng tham chiếu `ticket_ref` qua `TicketAdapter`.
  - *Nghiệp vụ thanh toán và xuất hóa đơn tài chính:* Thuộc phân hệ Kế toán ngoài ranh giới kho linh kiện.

---

## 2. Loại test, số lượng mỗi tầng và kỹ thuật chọn dữ liệu

- **Quy mô và phân bố thực tế (18 ca kiểm thử thực nghiệm độc lập):**
  - **Tầng API Integration / Live Endpoint (PostgreSQL 16 thật + HTTP Client trên cổng 3001):** 17 ca kiểm thử toàn trình End-to-End, bao gồm các ca luồng đúng, các ca giá trị biên (về 0, bằng ngưỡng, dưới ngưỡng), các ca từ chối an toàn khi dữ liệu sai, các ca kiểm thử bảo mật chuyên sâu (OWASP A01 BOLA, kiểm tra chữ ký token JWT, phân quyền vai trò RBAC, cô lập tenant đa trung tâm), và ca kiểm thử biên cực hạn tràn số Integer Overflow.
  - **Tầng Tái lập (CLI Reproducibility):** 1 ca kiểm thử tính bất biến (Idempotent) của tiến trình nạp dữ liệu `seed.js`.
- **Kỹ thuật chọn dữ liệu kiểm thử (Test Design Techniques):**
  - **Phân vùng tương đương (Equivalence Partitioning):**
    - *Vùng hợp lệ:* Phiếu bảo hành thuộc allowlist (`DANG_XU_LY`, `CHO_LINH_KIEN`, `DA_PHAN_CONG`); số lượng xuất `0 < quantity <= tồn_khả_dụng`; số lượng nhập `quantity > 0` và thỏa mãn tổng tồn sau nhập `quantity_tồn + quantity_nhập <= 2147483647`.
    - *Vùng không hợp lệ:* Số lượng nhập/xuất `<= 0`; số lượng nhập `> 2147483647` hoặc tổng tồn sau nhập vượt quá 2.147.483.647 (tràn số INT); số lượng xuất vượt quá tồn kho; phiếu bảo hành sai trung tâm hoặc đã đóng (`DA_DONG`).
  - **Phân tích giá trị biên (Boundary Value Analysis):** Tập trung vào ranh giới đại lượng tồn kho `quantity` so với `min_threshold`:
    - Ranh giới xuất hết tồn kho: `quantity_sau = 0`.
    - Ranh giới cảnh báo thiếu hụt: `quantity = min_threshold` (trạng thái An toàn, cờ cảnh báo false) và `quantity = min_threshold - 1` (kích hoạt Cảnh báo, cờ cảnh báo true).
    - Ranh giới nhập tối thiểu: `quantity = 1`.
    - Ranh giới cận trên kiểu dữ liệu: `quantity = 2147483647` (ngưỡng 32-bit INT của PostgreSQL) và điều kiện biên tổng tồn sau cộng không vượt quá `2147483647`.

---

## 3. Tiêu chí thành công đo được (Measurable Acceptance Criteria)

*(Bộ tiêu chí được chuẩn hóa và rà soát lại sau đợt kiểm thử thực nghiệm lần đầu)*

1. **Tính chính xác về số liệu nghiệp vụ:**
   - 100% ca kiểm thử luồng đúng phải thay đổi số dư tồn kho nguyên tử chính xác theo công thức toán học ($quantity_{mới} = quantity_{cũ} \pm \Delta$) và tự động tăng số lượng bản ghi trong sổ cái `part_transaction` thêm đúng 1 dòng.
2. **Khả năng từ chối an toàn và tính toàn vẹn:**
   - 100% ca kiểm thử dữ liệu sai hoặc vi phạm phân quyền phải bị từ chối với đúng mã trạng thái HTTP (400, 401, 403, 404, 409).
   - Số dư tồn kho trong CSDL không bị thay đổi và không có bản ghi giao dịch rác nào được tạo ra khi thao tác bị từ chối.
3. **Kiểm chứng bảo mật OWASP A01 (BOLA):**
   - Lệnh gọi HTTP thật mang token xác thực của Trung tâm 1 nhưng yêu cầu truy xuất hoặc thao tác dữ liệu kho của Trung tâm 2 phải bị từ chối với mã `403 FORBIDDEN`. CSDL Trung tâm 2 phải bất biến 100%.
4. **Kiểm chứng tính tái lập (Idempotency):**
   - Chạy lại lệnh `npm run seed` lần 2 phải ghi nhận chính xác 0 bản ghi mới cho cả 7 bảng, không bị lỗi duplicate key.
5. **Tiêu chuẩn ghi nhận kết quả:**
   - Mỗi ca kiểm thử phải có số liệu định lượng quan sát thực tế (mã HTTP trả về, số lượng tồn kho trước/sau, số dòng giao dịch trước/sau) và ảnh chụp màn hình terminal PowerShell thật lưu tại `docs/screenshots/TC-xx.png`.
   - Kết quả PASS/FAIL được ghi trung thực theo dữ liệu quan sát được. Mọi ca test FAIL đều phải được ghi nhận vào Bug Log để xử lý.

---

## 4. Môi trường và dữ liệu thử (Environment & Test Data)

- **Môi trường thực thi:**
  - Runtime: Node.js `v24.21.0` native test runner (`node --test`), Express 4.
  - Cơ sở dữ liệu: PostgreSQL 16 (cổng 5432, database `smart_crm`) quản lý 7 bảng quan hệ chuẩn hóa.
  - Cổng dịch vụ Backend: `http://localhost:3001`.
  - Công cụ gọi API: cURL (`curl.exe`) / Windows PowerShell.
- **Dữ liệu hạt giống (Seed Data):**
  - Nạp đầy đủ từ 6 file CSV mẫu chuẩn của Mekong Mobile: 6 trung tâm dịch vụ (`TT01` – `TT06`), 180 linh kiện, 717 dòng tồn kho (`part_stock`), 7.805 phiếu bảo hành tham chiếu (`ticket_ref`), 38 nhân viên kỹ thuật (`employee`).
- **Tập dữ liệu kiểm thử độc lập cho từng ca (Test Fixtures):**
  - Mỗi ca kiểm thử được phân bổ linh kiện và phiếu riêng biệt để đảm bảo tính độc lập hoàn toàn, không phụ thuộc vào thứ tự thực thi (TC-01 dùng `part_id = 1`, TC-02 dùng `part_id = 2`, TC-03 dùng `part_id = 175`, TC-04 dùng `part_id = 176`, TC-05 dùng `part_id = 177`, TC-06 dùng `part_id = 178`, TC-10 dùng `part_id = 179`).
  - **Lưu ý về Test Fixtures và Khôi phục Tồn kho (Reproducibility):** Các mã phiếu `BH-TEST-ACTIVE-01`, `BH-TEST-ACTIVE-02`, `BH-TEST-ACTIVE-03`, `BH-TEST-INVALID-01`, `BH-TEST-OTHER-01` (với `ticket_id >= 7801`) là các bộ dữ liệu mẫu (test fixtures) được kịch bản `seed.js` chủ động tạo thêm phục vụ kiểm thử tự động, không phải là dữ liệu phiếu khách hàng thực tế trong vận hành. Do các ca xuất kho TC-02 đến TC-05 làm giảm tồn kho trực tiếp trên các linh kiện mẫu này, để tái lập chính xác kết quả khi chạy lại các lệnh cURL kiểm thử, người kiểm thử có thể thực thi câu lệnh SQL khôi phục trạng thái ban đầu sau:
    ```sql
    UPDATE part_stock SET quantity = 23, min_threshold = 8 WHERE center_id = 1 AND part_id = 1;
    UPDATE part_stock SET quantity = 25, min_threshold = 12 WHERE center_id = 1 AND part_id = 2;
    UPDATE part_stock SET quantity = 3, min_threshold = 0 WHERE center_id = 1 AND part_id = 175;
    UPDATE part_stock SET quantity = 15, min_threshold = 10 WHERE center_id = 1 AND part_id = 176;
    UPDATE part_stock SET quantity = 10, min_threshold = 10 WHERE center_id = 1 AND part_id = 177;
    UPDATE part_stock SET quantity = 4, min_threshold = 0 WHERE center_id = 1 AND part_id = 178;
    UPDATE part_stock SET quantity = 2, min_threshold = 0 WHERE center_id = 1 AND part_id = 179;
    ```
