# Bảng Quản lý Minh chứng Nghiệm thu — Buổi 10 (Sprint 2)

**Dự án:** Smart CRM – Mekong Mobile  
**Phân hệ:** L5 — Quản lý kho linh kiện thay thế (*Part Inventory Management*)  
**Sinh viên:** Nguyễn Văn Chí – MSSV: 2374802010056  
**Thời điểm lập:** 23/10/2026  
**Thư mục lưu trữ:** `docs/evidence/buoi-10/`  

---

## 1. Bảng kê chi tiết các minh chứng thực tế (Trước End-to-End)

| Mã | Yêu cầu | Đường dẫn ảnh | Kết quả kiểm chứng | Trạng thái |
|:---:|:---|:---|:---|:---:|
| **IMG-B10-01** | Module L5 đã chạy được, thể hiện chức năng thực tế | `docs/evidence/buoi-10/01-module-l5-running.png` | Live App chạy tại `http://localhost:5173/`, hiển thị phân hệ L5 với đầy đủ 3 màn hình (M1, M2, M3), selector vai trò/trung tâm, bộ lọc cảnh báo thiếu hụt, thanh tìm kiếm và bảng dữ liệu tồn kho thực tế từ backend kèm huy hiệu trạng thái (An toàn, Dưới ngưỡng, Chưa đặt ngưỡng). | `PASS` |
| **IMG-B10-02** | Terminal hiển thị kết quả chạy ít nhất 5 unit test và số test PASS/FAIL | `docs/evidence/buoi-10/02-unit-tests-result.png` *(Đợi bổ sung ảnh chụp màn hình OS Terminal)* | Bộ kiểm thử backend chạy thực tế đạt **31/31 PASS** (22 Unit Tests + 9 Integration Tests). Môi trường agent headless/background không có quyền truy cập trực tiếp cửa sổ desktop OS Terminal (`CopyFromScreen: The handle is invalid`). Cần chụp thủ công từ terminal khi chạy `npm test`. | `BLOCKED` |
| **IMG-B10-03** | Test trường hợp biên hoặc ngoại lệ đã chạy | `docs/evidence/buoi-10/03-boundary-exception-test.png` *(Đợi bổ sung ảnh chụp màn hình OS Terminal)* | Bộ test trường hợp biên và ngoại lệ trong `issue.service.test.js` đã chạy thực tế đạt 100% (TC02: tồn về 0 hợp lệ, TC03: tồn bằng ngưỡng không cảnh báo, TC04: tồn dưới ngưỡng phát sinh cảnh báo, TC05: chặn xuất vượt tồn, TC06: chặn số lượng âm, TC07: chặn trái phép trung tâm, TC08/09/10: kiểm tra phiếu). Cần chụp thủ công từ terminal khi chạy `node --test tests/unit/issue.service.test.js`. | `BLOCKED` |
| **IMG-B10-04** | Trạng thái Loading trên màn hình | `docs/evidence/buoi-10/04-ui-loading.png` | Giao diện React M1 hiển thị đúng trạng thái Loading với component `LoadingSpinner` (biểu tượng xoay tròn) cùng thông báo *"Đang tra cứu tồn kho theo trung tâm..."* khi đang gửi request tới máy chủ. | `PASS` |
| **IMG-B10-05** | Trạng thái Empty khi API trả dữ liệu rỗng | `docs/evidence/buoi-10/05-ui-empty.png` | Giao diện React M1 hiển thị đúng component `EmptyState` với biểu tượng minh họa thùng hàng và thông báo hướng dẫn rõ ràng: *"Không tìm thấy linh kiện / Không có linh kiện nào khớp với từ khóa tìm kiếm."* khi truy vấn từ khóa không tồn tại. | `PASS` |
| **IMG-B10-06** | Trạng thái Error khi API gặp lỗi | `docs/evidence/buoi-10/06-ui-error.png` | Giao diện React M3 hiển thị `AlertBanner` loại nguy cấp (`danger`) màu đỏ, hiển thị đúng thông báo lỗi chuẩn hóa từ API: *"Không tìm thấy phiếu bảo hành với mã BH-KHONG-TON-TAI-ERR trong hệ thống."* kèm nút hành động *"🔄 Thử lại"* và nút đóng *"✕"*. | `PASS` |
| **IMG-B10-07** | README mục 3 có các bước chạy và lệnh thực tế | `docs/evidence/buoi-10/07-readme-run-steps.png` *(Đợi bổ sung ảnh chụp màn hình VS Code / GitHub)* | Mục 3 trong file `README.md` đã ghi nhận đầy đủ các bước hướng dẫn chuẩn bị môi trường, file cấu hình `.env`, lệnh migration, seed dữ liệu và lệnh khởi chạy backend/frontend. Cần chụp giao diện xem file README trên VS Code hoặc trình duyệt. | `BLOCKED` |
| **IMG-B10-08** | Kết quả thử chạy theo README từ bản clone mới | `docs/evidence/buoi-10/08-clean-clone-verification.png` *(Cần thực hiện trong môi trường clone sạch)* | Kiểm thử tính tái lập từ bản clone độc lập chưa thực hiện trên môi trường máy chủ tách biệt. | `UNVERIFIED` |
| **IMG-B10-09** | Terminal hiển thị lịch sử commit và tổng số commit | `docs/evidence/buoi-10/09-git-commit-history.png` *(Đợi bổ sung ảnh chụp màn hình OS Terminal)* | Lịch sử commit trên nhánh `dev` thể hiện các commit nguyên tử cho từng giai đoạn (kiến trúc, lỗi chuẩn hóa, auth lifecycle, script root, README, checklist). Cần chụp thủ công từ terminal khi chạy lệnh `git log --oneline -n 15`. | `BLOCKED` |

---

## 2. Hướng dẫn các bước chụp ảnh thủ công bổ sung cho các mục BLOCKED

Để đảm bảo 100% minh chứng là ảnh chụp thật từ môi trường của bạn (không dùng ảnh giả lập hay dựng mockup):

### Bổ sung cho IMG-B10-02 (Kết quả Unit Test):
1. Mở cửa sổ Terminal (PowerShell hoặc Command Prompt).
2. Di chuyển vào thư mục dự án và chạy:
   ```powershell
   npm test
   ```
3. Chụp lại toàn bộ cửa sổ terminal hiển thị rõ dòng tổng kết `tests 31 | suites 4 | pass 31 | fail 0`.
4. Lưu file ảnh vào: `docs/evidence/buoi-10/02-unit-tests-result.png`.

### Bổ sung cho IMG-B10-03 (Test trường hợp biên & ngoại lệ):
1. Mở Terminal và chạy riêng file test nghiệp vụ xuất kho:
   ```powershell
   cd src/backend
   node --test tests/unit/issue.service.test.js
   ```
2. Chụp cửa sổ terminal hiển thị các test case `TC02-Boundary`, `TC03-Boundary`, `TC04-Boundary`, `TC05-Negative`, `TC06-Negative`, v.v.
3. Lưu file ảnh vào: `docs/evidence/buoi-10/03-boundary-exception-test.png`.

### Bổ sung cho IMG-B10-07 (README mục 3):
1. Mở VS Code, mở file `README.md` và cuộn đến **Mục 3. Hướng dẫn cài đặt và khởi chạy thực tế**.
2. Nhấn `Ctrl + Shift + V` để mở Markdown Preview (hoặc để ở dạng Markdown Editor).
3. Chụp màn hình vùng hiển thị mục 3.
4. Lưu file ảnh vào: `docs/evidence/buoi-10/07-readme-run-steps.png`.

### Bổ sung cho IMG-B10-09 (Lịch sử Git commit):
1. Mở Terminal tại thư mục gốc dự án và chạy lệnh:
   ```powershell
   git log --oneline -n 15
   ```
2. Chụp cửa sổ terminal hiển thị danh sách các commit nguyên tử gần nhất trên nhánh `dev`.
3. Lưu file ảnh vào: `docs/evidence/buoi-10/09-git-commit-history.png`.

Sau khi đã lưu các ảnh trên, bạn chỉ cần cập nhật trạng thái trong bảng trên từ `BLOCKED` sang `PASS`.
