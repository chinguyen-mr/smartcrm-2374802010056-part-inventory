# Danh mục ảnh minh chứng thực tế cho Báo cáo BT2 – Smart CRM Luồng L5

**Dự án:** Smart CRM – Mekong Mobile  
**Phân hệ:** L5 – Quản lý kho linh kiện thay thế (*Part Inventory Management*)  
**Sinh viên:** Nguyễn Văn Chí – MSSV: 2374802010056  
**Thời điểm thu thập:** 19/10/2026  
**Môi trường:** Node.js v24.21.0, Express.js, PostgreSQL 16, React 19 + Vite  

---

## Bảng kê chi tiết 28 ảnh minh chứng thực tế

| STT | Tên file ảnh | Thư mục lưu trữ | Nội dung minh chứng | Nguồn bằng chứng | Trạng thái | Ghi chú |
|:---:|:---|:---|:---|:---|:---:|:---|
| **01** | `01_repository_tree.png` | `01_repository_architecture/` | Cấu trúc cây thư mục toàn diện của repository (backend, frontend, db, data, docs, tests) | Cây thư mục hệ thống thực tế | `CAPTURED` | Hiển thị đầy đủ các thư mục theo chuẩn layered architecture |
| **02** | `02_architecture_mapping.png` | `01_repository_architecture/` | Sơ đồ ánh xạ kiến trúc ba lớp tổng hợp từ mã nguồn (Routes $\rightarrow$ Services $\rightarrow$ Repositories $\rightarrow$ PostgreSQL) | Mã nguồn `src/backend/src/` | `CAPTURED` | Trình bày luồng dữ liệu và trách nhiệm của từng tầng |
| **03** | `03_service_repository_separation.png` | `01_repository_architecture/` | Minh chứng phân tách rõ ràng giữa Service (nghiệp vụ) và Repository (truy cập SQL) | `issue.service.js` & `stock.repository.js` | `CAPTURED` | Thể hiện cơ chế khóa bi quan `SELECT ... FOR UPDATE` |
| **04** | `04_M1_stock_lookup.png` | `02_M1_stock_lookup/` | Màn hình M1 tra cứu danh mục và số lượng tồn kho theo trung tâm | Live App tại `http://localhost:5173/` | `CAPTURED` | Hiển thị mã LK, tên, đơn giá, tồn kho, ngưỡng và trạng thái |
| **05** | `05_M1_search_filter.png` | `02_M1_stock_lookup/` | Kết quả tìm kiếm linh kiện theo từ khóa "Samsung" trên M1 | Live App M1 Search API | `CAPTURED` | Lọc tức thời qua query `q=Samsung` |
| **06** | `06_M1_low_stock_alert.png` | `03_M1_low_stock_alert/` | Danh sách linh kiện có số lượng tồn thấp hơn ngưỡng tối thiểu (`quantity < min_threshold`) | Live App M1 Alert Filter API | `CAPTURED` | Hiển thị huy hiệu màu cam "DƯỚI NGƯỠNG (41/51)" |
| **07** | `07_M1_threshold_management.png` | `03_M1_low_stock_alert/` | Hộp thoại (modal) thiết lập ngưỡng cảnh báo tồn kho của Quản lý trung tâm (FR8) | Live App M1 Threshold Modal | `CAPTURED` | Áp dụng quy tắc QT-09, hỗ trợ thiết lập và lưu ngưỡng |
| **08** | `08_M2_receipt_form.png` | `04_M2_receipt/` | Form ghi nhận nhập kho linh kiện với các trường bắt buộc | Live App M2 Screen | `CAPTURED` | Chọn linh kiện, nhập số lượng nguyên dương, mã tham chiếu |
| **09** | `09_M2_receipt_success.png` | `04_M2_receipt/` | Thông báo nhập kho thành công và cập nhật sổ cái giao dịch | Live API `POST /api/stock/receipts` | `CAPTURED` | Giao dịch #4959, tăng tồn lên 64, cập nhật bảng lịch sử |
| **10** | `10_M3_issue_form.png` | `05_M3_issue/` | Form ghi nhận xuất kho linh kiện theo mã phiếu bảo hành | Live App M3 Screen | `CAPTURED` | Nhập mã phiếu `BH-TEST-ACTIVE-01`, chọn LK, nhập số lượng |
| **11** | `11_M3_issue_success.png` | `05_M3_issue/` | Thông báo xuất kho thành công và bảng danh sách linh kiện đã xuất theo phiếu | Live API `POST /api/stock/issues` | `CAPTURED` | Giao dịch #4960, giảm tồn từ 64 về 62, liên kết phiếu |
| **12** | `12_M3_insufficient_stock.png` | `05_M3_issue/` | Thông báo từ chối xuất kho khi số lượng yêu cầu vượt quá tồn hiện tại (QT-09) | Live Backend Error Response (409) | `CAPTURED` | Mã lỗi `INSUFFICIENT_STOCK`, tồn kho được bảo toàn nguyên vẹn |
| **13** | `13_backend_test_summary.png` | `06_backend_tests/` | Báo cáo tổng kết chạy toàn bộ bộ kiểm thử Backend (31/31 test pass) | Lệnh `npm test` tại `src/backend` | `CAPTURED` | 22 Unit Tests + 9 Integration Tests đạt 100% |
| **14** | `14_test_happy_path.png` | `06_backend_tests/` | Kết quả chi tiết các ca kiểm thử luồng đúng (Happy Path) | Unit & Integration Test Suites | `CAPTURED` | TC01 (Xuất kho), TC11 (Nhập kho), API-IT-03 (Toàn trình) |
| **15** | `15_test_boundary_case.png` | `06_backend_tests/` | Kết quả chi tiết các ca kiểm thử giá trị biên kho (Boundary Cases) | `issue.service.test.js` | `CAPTURED` | TC02 (tồn về 0), TC03 (tồn = ngưỡng), TC04 (tồn < ngưỡng) |
| **16** | `16_test_invalid_input.png` | `06_backend_tests/` | Kết quả chi tiết các ca kiểm thử từ chối dữ liệu sai (Negative Tests) | Unit Test Suites | `CAPTURED` | Số lượng $\le 0$, phiếu không tồn tại (404), phiếu đã đóng (409) |
| **17** | `17_test_cross_center_authorization.png` | `06_backend_tests/` | Kết quả kiểm thử phân quyền trung tâm và vai trò người dùng (QT-14) | Unit & Integration RBAC Tests | `CAPTURED` | Chặn truy cập chéo trung tâm (403), chặn KTV đặt ngưỡng (403) |
| **18** | `18_UI_loading.png` | `07_frontend_states/` | Trạng thái giao diện đang tải dữ liệu (Loading State) | React UI Component | `CAPTURED` | Spinner xoay tròn và thông báo đang kết nối máy chủ |
| **19** | `19_UI_empty.png` | `07_frontend_states/` | Trạng thái giao diện khi không tìm thấy dữ liệu (Empty State) | React UI Component | `CAPTURED` | Minh họa hộp rỗng và thông báo hướng dẫn người dùng |
| **20** | `20_UI_error.png` | `07_frontend_states/` | Trạng thái giao diện khi xảy ra lỗi kết nối hoặc bị từ chối quyền (Error State) | React UI Alert Banner | `CAPTURED` | Banner cảnh báo đỏ nêu rõ mã lỗi HTTP 403 Forbidden |
| **21** | `21_UI_success.png` | `07_frontend_states/` | Trạng thái giao diện khi thao tác thành công (Success State) | React UI Alert Banner | `CAPTURED` | Banner thông báo xanh kèm thông tin số giao dịch |
| **22** | `22_migration_success.png` | `08_reproducibility/` | Output thực tế khi chạy lệnh migration tạo cấu trúc 7 bảng | Lệnh `npm run migrate` | `CAPTURED` | DDL chính thức từ `sql/sql-ddl.sql` thực thi hoàn tất |
| **23** | `23_seed_success.png` | `08_reproducibility/` | Output thực tế khi chạy lệnh nạp dữ liệu mẫu ban đầu | Lệnh `npm run seed` | `CAPTURED` | Nạp hơn 17.000 dòng dữ liệu từ 6 file CSV (kèm `technicians.csv`) |
| **24** | `24_seed_rerun_idempotency.png` | `08_reproducibility/` | Output thực tế khi chạy lại lệnh seed lần thứ hai (Tính Idempotent) | Lệnh `npm run seed` (lần 2) | `CAPTURED` | Nạp 0 bản ghi mới, 0 lỗi, chứng minh an toàn tuyệt đối |
| **25** | `25_frontend_build.png` | `08_reproducibility/` | Output thực tế khi build bundle production cho Frontend | Lệnh `npm run build` tại `src/frontend` | `CAPTURED` | Vite build hoàn thành trong 128ms, không có lỗi |
| **26** | `26_git_status.png` | `09_git_and_docs/` | Trạng thái Git clean working tree trên nhánh `dev` | Lệnh `git status` & `git log` | `CAPTURED` | Working tree sạch sẽ, commit mới nhất hiển thị rõ |
| **27** | `27_git_tag_v02.png` | `09_git_and_docs/` | Xác nhận Git Tag `v0.2` đã tồn tại ở cả Local và Remote GitHub | `git tag -l` & `git ls-remote` | `CAPTURED` | Tagged commit phục vụ nộp bài BT2 chính thức |
| **28** | `28_required_docs.png` | `09_git_and_docs/` | Danh sách các tệp tài liệu và cấu hình bắt buộc trong repository | Thư mục `docs/` và root | `CAPTURED` | README, thay-doi-thiet-ke, ai-disclosure, .env.example, lockfiles |
