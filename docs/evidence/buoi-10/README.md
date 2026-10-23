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
| **IMG-B10-07** | README mục 3 có các bước chạy và lệnh thực tế | `docs/evidence/buoi-10/07-readme-run-steps.png` *(Đợi bổ sung ảnh chụp màn hình VS Code / GitHub)* | Mục 3 & 4 trong file `README.md` đã ghi nhận đầy đủ các bước hướng dẫn chuẩn bị môi trường, file cấu hình `.env`, lệnh migration, seed dữ liệu và lệnh khởi chạy backend/frontend. Cần chụp giao diện xem file README trên VS Code hoặc trình duyệt. | `BLOCKED` |
| **IMG-B10-08** | Kết quả thử chạy theo README từ bản clone mới | Ghi nhận nhật ký kiểm thử Clean Clone | Đã thực hiện clone repo từ GitHub về thư mục sạch `d:\DoAn\test-clean-clone`, thực hiện đúng từng lệnh trong README: `npm install` (100 packages, 0 vulnerability), `npm test` (**31/31 PASS**, 4 test suites hoàn tất trong 10.39s), `npm run build` (Vite build sạch trong 206ms). Toàn bộ quy trình chạy mượt mà không lỗi. | `PASS` |
| **IMG-B10-09** | Terminal hiển thị lịch sử commit và tổng số commit | `docs/evidence/buoi-10/09-git-commit-history.png` *(Đợi bổ sung ảnh chụp màn hình OS Terminal)* | Lịch sử commit trên nhánh `dev` thể hiện các commit nguyên tử cho từng giai đoạn (kiến trúc, lỗi chuẩn hóa, auth lifecycle, script root, README, checklist, evidence). Tổng số commit hiện tại là **19 commits** (yêu cầu $\ge$ 8). Cần chụp thủ công từ terminal khi chạy lệnh `git log --oneline -n 15`. | `BLOCKED` |

---

## 2. Bảng minh chứng luồng chính chạy END-TO-END (Mục 2 & Mục 4 — Slide 6, 10)

Kịch bản kiểm thử tích hợp toàn trình trên dữ liệu thực tế tại Trung tâm #1 (TT01) với linh kiện `MH-SS-03` (Màn hình Samsung loại 3, ngưỡng tối thiểu: 3):

| Bước | Hành động | Minh chứng thực tế | Dữ liệu đầu vào & Kết quả quan sát được | Trạng thái |
|:---:|:---|:---|:---|:---:|
| **E2E-01** | Tra cứu tồn kho ban đầu (M1) | `docs/evidence/buoi-10/e2e-01-m1-before.png` | - Mã LK: `MH-SS-03`<br>- Tồn kho ban đầu: **4**<br>- Ngưỡng tối thiểu: **3**<br>- Trạng thái tồn: `✓ An toàn (4)` | `PASS` |
| **E2E-02** | Ghi nhận Nhập kho (M2) | `docs/evidence/buoi-10/e2e-02-m2-receipt.png` | - Chọn LK: `MH-SS-03`<br>- Số lượng nhập: **+5**<br>- Chứng từ: `PN-E2E-TEST-01`<br>- Kết quả: Giao dịch **#4963**, tồn mới tăng lên **9**, ghi sổ cái giao dịch bất biến thành công. | `PASS` |
| **E2E-03** | Ghi nhận Xuất kho theo Phiếu (M3) | `docs/evidence/buoi-10/e2e-03-m3-issue.png` | - Mã phiếu bảo hành: `BH-TEST-ACTIVE-01`<br>- Chọn LK: `MH-SS-03`<br>- Số lượng xuất: **7**<br>- Kết quả: Giao dịch **#4964**, tồn kho giảm từ 9 về **2**.<br>- Hệ thống tự động kích hoạt: `⚠️ CẢNH BÁO: Tồn kho đã giảm xuống dưới ngưỡng tối thiểu!` | `PASS` |
| **E2E-04** | Đối chiếu tồn mới & Cảnh báo (M1) | `docs/evidence/buoi-10/e2e-04-m1-after.png` | - Lọc linh kiện `MH-SS-03` tại M1.<br>- Số lượng tồn mới: **2**<br>- Trạng thái tồn tự động chuyển sang: `⚠️ DƯỚI NGƯỠNG (2/3)` màu cam (đúng chuẩn quy tắc nghiệp vụ QT-09). | `PASS` |

---

## 3. Hướng dẫn các bước chụp ảnh thủ công bổ sung cho các mục BLOCKED

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

### Bổ sung cho IMG-B10-07 (README mục 3 & 4):
1. Mở VS Code, mở file `README.md` và cuộn đến **Mục 4. Hướng dẫn cài đặt và chạy (Quy trình Clone-and-Run)**.
2. Nhấn `Ctrl + Shift + V` để mở Markdown Preview (hoặc để ở dạng Markdown Editor).
3. Chụp màn hình vùng hiển thị mục 4.
4. Lưu file ảnh vào: `docs/evidence/buoi-10/07-readme-run-steps.png`.

### Bổ sung cho IMG-B10-09 (Lịch sử Git commit):
1. Mở Terminal tại thư mục gốc dự án và chạy lệnh:
   ```powershell
   git log --oneline -n 15
   ```
2. Chụp cửa sổ terminal hiển thị danh sách các commit nguyên tử gần nhất trên nhánh `dev`.
3. Lưu file ảnh vào: `docs/evidence/buoi-10/09-git-commit-history.png`.

Sau khi đã lưu các ảnh trên, bạn chỉ cần cập nhật trạng thái trong bảng trên từ `BLOCKED` sang `PASS`.
