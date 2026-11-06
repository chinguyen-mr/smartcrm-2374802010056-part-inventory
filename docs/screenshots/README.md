# Thư mục ảnh chụp minh chứng kiểm thử và hệ thống — Luồng L5

Thư mục này lưu trữ toàn bộ ảnh chụp màn hình (screenshots) minh chứng cho kết quả kiểm thử tự động, giao diện người dùng và tính tái lập của phân hệ Smart CRM – Quản lý kho linh kiện thay thế (Luồng L5, Track SE).

---

## 1. Bảng danh mục ảnh minh chứng kiểm thử (Test Execution Screenshots)

| Tên tệp ảnh | Phân loại kiểm thử | Nội dung / Ca kiểm thử minh chứng | Kết quả |
|:---|:---|:---|:---:|
| [`13_backend_test_summary.png`](./13_backend_test_summary.png) | **Tổng hợp toàn bộ** | Terminal chạy lệnh `npm test` đạt **31/31 ca test PASS 100%** (22 Unit + 9 Integration) | **PASS** |
| [`14_test_happy_path.png`](./14_test_happy_path.png) | **1. Luồng đúng (Positive)** | Ca kiểm thử luồng nghiệp vụ hợp lệ: `TC01`, `TC11`, `TC12`, `TC17`, `TC18`, `API-IT-01` đến `API-IT-03` | **PASS** |
| [`15_test_boundary_case.png`](./15_test_boundary_case.png) | **2. Giá trị biên (Boundary)** | Ca kiểm thử giá trị biên: `TC02` (xuất hết về 0), `TC03` (tồn = ngưỡng), `TC04` (tồn < ngưỡng), `TC13` (nhập min=1), `TC19` (ngưỡng=0) | **PASS** |
| [`16_test_invalid_input.png`](./16_test_invalid_input.png) | **3. Dữ liệu sai (Negative)** | Ca kiểm thử từ chối an toàn: `TC05` (xuất vượt tồn 409), `TC06` (số lượng âm 400), `TC08` (phiếu không tồn tại), `TC10` (phiếu đã đóng), `TC14`, `TC15`, `TC21` | **PASS** |
| [`17_test_cross_center_authorization.png`](./17_test_cross_center_authorization.png) | **4. Bảo mật / Phân quyền (Security)** | Kiểm soát phân quyền đa trung tâm QT-14 & vai trò: `TC07` (chặn xuất chéo trung tâm 403), `TC16` (chặn nhập chéo 403), `TC20` (chặn KTV sửa ngưỡng 403), `TC22` (chặn tra cứu chéo 403) | **PASS** |
| [`24_seed_rerun_idempotency.png`](./24_seed_rerun_idempotency.png) | **5. Tái lập / Bất biến (Idempotent)** | Chạy lại lệnh `npm run seed` lần 2: nạp đúng 0 bản ghi mới, không trùng khóa, bảo toàn số dư | **PASS** |

---

## 2. Bảng danh mục ảnh minh chứng giao diện và chức năng (Functional & UI States)

| Tên tệp ảnh | Phân loại | Mô tả nội dung |
|:---|:---|:---|
| [`04_M1_stock_lookup.png`](./04_M1_stock_lookup.png) | Chức năng M1 | Tra cứu danh mục linh kiện và số lượng tồn kho theo trung tâm |
| [`05_M1_search_filter.png`](./05_M1_search_filter.png) | Chức năng M1 | Tìm kiếm và lọc linh kiện theo từ khóa và trạng thái tồn kho |
| [`06_M1_low_stock_alert.png`](./06_M1_low_stock_alert.png) | Chức năng M1 | Danh sách linh kiện dưới ngưỡng cảnh báo (`quantity < min_threshold`) |
| [`07_M1_threshold_management.png`](./07_M1_threshold_management.png) | Chức năng M1 | Giao diện Quản lý trung tâm thiết lập ngưỡng cảnh báo tối thiểu |
| [`08_M2_receipt_form.png`](./08_M2_receipt_form.png) | Chức năng M2 | Biểu mẫu nhập kho linh kiện kèm chứng từ tham chiếu |
| [`09_M2_receipt_success.png`](./09_M2_receipt_success.png) | Chức năng M2 | Ghi nhận nhập kho thành công và cập nhật tăng tồn kho tức thời |
| [`10_M3_issue_form.png`](./10_M3_issue_form.png) | Chức năng M3 | Biểu mẫu xuất kho linh kiện theo phiếu bảo hành hợp lệ |
| [`11_M3_issue_success.png`](./11_M3_issue_success.png) | Chức năng M3 | Ghi nhận xuất kho thành công, trừ tồn nguyên tử và tạo giao dịch XUAT |
| [`12_M3_insufficient_stock.png`](./12_M3_insufficient_stock.png) | Chức năng M3 | Hệ thống từ chối an toàn khi yêu cầu xuất vượt tồn khả dụng (`QT-09`) |
| [`18_UI_loading.png`](./18_UI_loading.png) | Trạng thái UI | Trạng thái **Loading**: Hiệu ứng vòng xoay đang tải dữ liệu từ server |
| [`19_UI_empty.png`](./19_UI_empty.png) | Trạng thái UI | Trạng thái **Empty**: Giao diện hiển thị khi không tìm thấy bản ghi nào |
| [`20_UI_error.png`](./20_UI_error.png) | Trạng thái UI | Trạng thái **Error**: Banner báo lỗi thân thiện kèm thông điệp nghiệp vụ |
| [`21_UI_success.png`](./21_UI_success.png) | Trạng thái UI | Trạng thái **Success**: Thông báo thao tác thành công và cập nhật state |

---

## 3. Bảng danh mục ảnh minh chứng hạ tầng và đóng gói (Build & Environment)

| Tên tệp ảnh | Phân loại | Mô tả nội dung |
|:---|:---|:---|
| [`01_repository_tree.png`](./01_repository_tree.png) | Kiến trúc | Cây thư mục dự án phân tầng rõ rệt (`src/backend`, `src/frontend`) |
| [`02_architecture_mapping.png`](./02_architecture_mapping.png) | Kiến trúc | Sơ đồ ánh xạ kiến trúc 3 lớp (*Routes -> Services -> Repositories*) |
| [`03_service_repository_separation.png`](./03_service_repository_separation.png) | Kiến trúc | Phân định trách nhiệm giữa tầng Service và Repository độc lập |
| [`22_migration_success.png`](./22_migration_success.png) | Tái lập C1 | Khởi tạo sạch sẽ 7 bảng CSDL PostgreSQL từ `sql/sql-ddl.sql` |
| [`23_seed_success.png`](./23_seed_success.png) | Tái lập C1 | Nạp hơn 17.000 dòng dữ liệu mẫu chuẩn Mekong Mobile |
| [`25_frontend_build.png`](./25_frontend_build.png) | Đóng gói | Biên dịch production bundle bằng Vite thành công trong 128ms |
| [`26_git_status.png`](./26_git_status.png) | Quản lý mã nguồn | Trạng thái Git clean working tree trên nhánh `main` |
| [`27_git_tag_v02.png`](./27_git_tag_v02.png) | Quản lý mã nguồn | Git Tag `v0.2` đã đồng bộ thành công lên remote GitHub origin |
| [`28_required_docs.png`](./28_required_docs.png) | Tài liệu | Đầy đủ danh mục tài liệu đặc tả bắt buộc theo yêu cầu học phần |
