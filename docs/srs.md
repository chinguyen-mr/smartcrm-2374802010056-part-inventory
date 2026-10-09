# Đặc tả yêu cầu phần mềm cho Smart CRM L5

## 1. Mục đích và phạm vi

Luồng L5 quản lý tồn kho linh kiện thay thế tại các trung tâm bảo hành. Tài liệu này xác định yêu cầu nghiệp vụ, vai trò, tiêu chí chấp nhận và các mục tiêu chất lượng làm căn cứ cho Use Case, API contract, kiến trúc và mô hình dữ liệu.

**Trong phạm vi:** tra cứu linh kiện/tồn theo trung tâm; nhập kho; xuất linh kiện gắn với phiếu bảo hành; cảnh báo tồn dưới ngưỡng; cấu hình ngưỡng; xem lịch sử giao dịch và xem linh kiện đã xuất theo phiếu.

**Ngoài phạm vi cốt lõi:** quản lý khách hàng/đơn hàng, nhà cung cấp/đặt mua, tồn sản phẩm bán lẻ, dự báo AI và tạo hoặc đổi trạng thái phiếu bảo hành. Danh sách phiếu chờ linh kiện là chức năng COULD, chưa thuộc phạm vi hiện thực chính của BT1.

## 2. Tác nhân và thuật ngữ

| Tác nhân/thuật ngữ | Ý nghĩa trong L5 |
|---|---|
| KTV | Tra cứu tồn, xuất linh kiện cho phiếu hợp lệ và xem linh kiện đã xuất cho phiếu; chỉ thao tác trong phạm vi trung tâm được cấp. |
| QLTT | Tra cứu tồn, nhập kho, xem cảnh báo, thiết lập ngưỡng và xem lịch sử tại trung tâm được cấp. |
| Hệ thống phiếu bảo hành | Hệ thống bên ngoài cung cấp thông tin để xác nhận phiếu, trung tâm và trạng thái trước khi xuất. L5 không tạo hoặc đổi trạng thái phiếu. |
| `part` | Danh mục linh kiện thay thế. |
| `part_stock` | Số lượng hiện tại của một linh kiện tại một trung tâm. |
| `part_transaction` | Sổ ghi nhận bất biến các giao dịch `NHAP` và `XUAT`. |
| `min_threshold` | Ngưỡng cảnh báo theo cặp trung tâm/linh kiện; cảnh báo khi tồn nhỏ hơn ngưỡng. |

Các tên bảng khác như `service_center`, `ticket_ref` và cấu trúc `ticket_part` là lựa chọn thiết kế đang được đối chiếu, chưa khẳng định là schema của hệ thống tổng thể.

## 3. User Story và mức ưu tiên

| ID | User Story | Ưu tiên | Use Case |
|---|---|---|---|
| US1 | Là KTV, tôi muốn tra cứu tồn linh kiện tại trung tâm được cấp để biết linh kiện sẵn có trước khi sửa chữa. | MUST | UC1 |
| US2 | Là KTV, tôi muốn ghi nhận linh kiện xuất cho một phiếu bảo hành hợp lệ để theo dõi việc sử dụng. | MUST | UC2 |
| US3 | Là QLTT, tôi muốn ghi nhận linh kiện nhập kho để số tồn được cập nhật theo giao dịch. | MUST | UC3 |
| US4 | Là QLTT, tôi muốn xem linh kiện dưới ngưỡng để chủ động bổ sung. | SHOULD | UC4, UC5 |
| US5 | Là QLTT, tôi muốn thiết lập ngưỡng cho từng linh kiện tại trung tâm để cảnh báo phù hợp. | SHOULD | UC6 |
| US6 | Là QLTT, tôi muốn xem và lọc lịch sử nhập/xuất để đối chiếu biến động kho. | SHOULD | UC7 |
| US7 | Là KTV, tôi muốn xem linh kiện đã xuất cho một phiếu để kiểm tra việc sử dụng. | SHOULD | UC8 |
| US8 | Là QLTT, tôi muốn xem phiếu đang chờ linh kiện để theo dõi các trường hợp còn thiếu. | COULD; ngoài phạm vi chính | UC9 |

## 4. Tiêu chí chấp nhận cho MUST

| Story | Điều kiện và hành động | Kết quả mong đợi |
|---|---|---|
| US1 | KTV có quyền tại trung tâm và tra cứu một linh kiện có dòng tồn. | Hiển thị mã, tên, số lượng, ngưỡng và trạng thái cảnh báo tại đúng trung tâm. |
| US1 | Linh kiện chưa có dòng tồn tại trung tâm. | Hiển thị số lượng 0/trạng thái chưa có trong kho; không truy xuất dữ liệu trung tâm khác. |
| US1 | KTV yêu cầu dữ liệu của trung tâm ngoài phạm vi. | Từ chối yêu cầu và không trả dữ liệu trung tâm đó. |
| US2 | Phiếu được xác nhận hợp lệ, cùng trung tâm; tồn đủ; số lượng xuất là số nguyên dương. | Ghi một giao dịch `XUAT`, giảm tồn đúng lượng xuất và liên kết giao dịch với phiếu. |
| US2 | Tồn là 2, yêu cầu xuất 3. | Từ chối, báo tồn hiện tại; không đổi tồn và không ghi giao dịch xuất. |
| US2 | Phiếu không tồn tại, sai trung tâm hoặc trạng thái không cho phép. | Từ chối và giữ nguyên dữ liệu kho. Tập trạng thái hợp lệ cần được chủ hệ thống phiếu xác nhận. |
| US3 | QLTT có quyền và nhập số nguyên dương cho linh kiện. | Ghi một giao dịch `NHAP` và tăng tồn đúng lượng nhập. |
| US3 | Số lượng nhập không lớn hơn 0 hoặc sai định dạng. | Báo lỗi dữ liệu và không đổi tồn. |
| US3 | Cặp trung tâm/linh kiện chưa có dòng tồn. | Tạo dòng tồn rồi ghi nhận số lượng nhập theo cùng một thao tác nguyên tử. |

Các giá trị trung tâm và số lượng trong tiêu chí là dữ liệu minh họa kiểm thử, không phải số liệu sản xuất.

## 5. Yêu cầu chức năng

| ID | Yêu cầu có thể kiểm chứng | Ưu tiên | Truy vết |
|---|---|---|---|
| FR1 | Hiển thị danh sách linh kiện, số lượng tồn và ngưỡng tại trung tâm người dùng được phép; hỗ trợ tìm theo mã hoặc tên. | MUST | US1, UC1 |
| FR2 | KTV ghi nhận xuất với phiếu, linh kiện và số lượng nguyên dương; khi thành công tồn giảm đúng số lượng. | MUST | US2, UC2 |
| FR3 | Từ chối xuất vượt tồn; báo số lượng hiện tại và không đổi dữ liệu. | MUST | US2, UC2 |
| FR4 | Từ chối xuất khi phiếu không tồn tại, khác trung tâm hoặc trạng thái không được phép theo quy tắc đã chốt. | MUST | US2, UC2 |
| FR5 | QLTT ghi nhận nhập với số lượng nguyên dương; tồn tăng đúng lượng nhập. | MUST | US3, UC3 |
| FR6 | Xác định cảnh báo khi `quantity < min_threshold`; bỏ cảnh báo khi `quantity >= min_threshold`. | SHOULD | US4, UC4 |
| FR7 | Hiển thị danh sách linh kiện đang cảnh báo của trung tâm, gồm mã, tên, tồn và ngưỡng. | SHOULD | US4, UC5 |
| FR8 | QLTT đặt ngưỡng là số nguyên không âm cho một cặp trung tâm/linh kiện. | SHOULD | US5, UC6 |
| FR9 | Lưu loại giao dịch, linh kiện, số lượng, thời điểm và mã phiếu khi xuất; giao dịch đã ghi không được sửa/xóa. | MUST | US2, US3, UC2, UC3 |
| FR10 | QLTT xem lịch sử theo trung tâm, linh kiện, loại và khoảng ngày; sắp xếp theo thời gian và phân trang. | SHOULD | US6, UC7 |
| FR11 | KTV xem các linh kiện đã xuất cho một phiếu bảo hành. | SHOULD | US7, UC8 |

FR9 yêu cầu lưu người thực hiện trong một số mô tả của báo cáo, nhưng schema và sơ đồ ERD không thống nhất về dữ liệu nhân viên. Cần xác nhận nguồn định danh và cách lưu trước khi chốt mô hình.

## 6. Yêu cầu phi chức năng

Các ngưỡng dưới đây là mục tiêu đề xuất cho prototype. Chỉ ghi nhận đạt/không đạt sau khi thực hiện đo hoặc kiểm thử.

| ID | Nhóm | Mục tiêu đo được | Cách xác minh |
|---|---|---|---|
| NFR1 | Hiệu năng | Tra cứu tồn có P95 dưới 2 giây với tối đa 1.080 dòng tồn và 20 yêu cầu đọc đồng thời trên môi trường thử nghiệm. | Ghi thời gian của các lần truy vấn theo cấu hình thử đã chốt. |
| NFR2 | Toàn vẹn | 100% thao tác nhập/xuất thành công ghi đúng một giao dịch và cập nhật tồn nguyên tử; thao tác lỗi không để lại thay đổi một phần. | Kiểm tra tồn và lịch sử sau các kịch bản thành công/lỗi. |
| NFR3 | Đồng thời | Trong 100 lần thử hai yêu cầu xuất đồng thời khi tồn chỉ đủ một yêu cầu, đúng một yêu cầu thành công và không có tồn âm. | Chạy kiểm thử tranh chấp ở API/CSDL. |
| NFR4 | Phân quyền | 100% yêu cầu không xác thực hoặc truy cập trung tâm ngoài quyền bị từ chối; mục tiêu cho truy cập khác trung tâm là HTTP 403. | Kiểm tra đọc/ghi với nhiều trung tâm thử nghiệm. |
| NFR5 | Khả dụng thao tác | Sau hướng dẫn 5 phút, ít nhất 4/5 người dùng mới hoàn thành tra cứu và một lần xuất trong 60 giây, không quá 4 trường nhập chính. | Thử nghiệm có ghi thời gian và số thao tác. |

## 7. Quy tắc và giả định nghiệp vụ

| ID | Quy tắc hoặc giả định |
|---|---|
| QT-09 | Không xuất vượt tồn. Cảnh báo khi tồn thấp hơn ngưỡng; bằng ngưỡng thì không cảnh báo. |
| QT-13 | Không xóa vật lý giao dịch đã ghi; mọi điều chỉnh (nếu được chính sách cho phép) cần dấu vết. |
| QT-14 | Người dùng chỉ xem/ghi dữ liệu của trung tâm được phân quyền. |
| QT-L5-1 | Mỗi cặp trung tâm/linh kiện có tối đa một dòng tồn; tồn không âm; mã linh kiện duy nhất. |
| G1 | Cơ chế đăng nhập và nguồn claim người dùng/trung tâm sẽ tích hợp với dịch vụ hiện có. |
| G2 | Hệ thống phiếu cung cấp API tra cứu phiếu; các trạng thái cho phép xuất chưa được chốt. |
| G3 | Cần xác định cách lưu người thực hiện giao dịch. |
| G4 | Cần chốt biểu diễn ngưỡng chưa cấu hình và liệu ngưỡng có bắt buộc ngay khi tạo dòng tồn. |
| G5 | Nếu chưa có dòng tồn, tra cứu hiển thị 0; nhập lần đầu cần tạo dòng tồn tương thích với khóa ghép. |

## 8. Kiểm tra bộ dữ liệu tham chiếu và code hiện có

Đối chiếu chỉ đọc với các CSV L5 trong bộ dữ liệu tham chiếu cho kết quả sau:

| Tệp | Số dòng dữ liệu | Nhận xét |
|---|---:|---|
| `parts.csv` | 180 | Mỗi dòng có `part_id`, mã, tên và đơn giá. |
| `service_centers.csv` | 6 | Mỗi dòng có `center_id`, mã và tên trung tâm. |
| `part_stock.csv` | 717 | Có 717 cặp trung tâm/linh kiện; không trùng cặp; tất cả số lượng/ngưỡng quan sát được không âm. |
| `part_transactions.csv` | 4.954 | 891 `NHAP`, 4.063 `XUAT`; các mã linh kiện/trung tâm đều ánh xạ được tới danh mục. |
| `tickets_history.csv` | 7.800 | 7.800 mã phiếu phân biệt; mọi mã phiếu của 4.063 dòng `XUAT` đều tìm thấy trong tệp này. |

Toàn bộ tổ hợp lý thuyết là `6 × 180 = 1.080`; có 363 tổ hợp chưa có dòng trong `part_stock`. Trong bộ dữ liệu được kiểm tra, số tồn của các cặp khớp với tổng nhập trừ tổng xuất theo các giao dịch được cung cấp. Đây là kết quả đối chiếu bộ mẫu, không phải bảo đảm cho dữ liệu triển khai. Tệp tồn không ghi thời điểm snapshot riêng, nên không suy ra dữ liệu đại diện cho tồn hiện tại của môi trường thật. Các trạng thái phiếu xuất hiện trong CSV cũng không đủ để kết luận trạng thái nào được phép xuất.

Đọc code backend hiện có cho thấy `server.js` mới có `/api/hello` và `/api/db-test`; chưa có endpoint nghiệp vụ L5. Vì vậy API contract, kiến trúc và các yêu cầu trong tài liệu là thiết kế, không phải mô tả tính năng đã chạy.

## 9. Truy vết yêu cầu

| FR | Story | Use Case | Mức | Màn hình theo wireframe Draw.io hiện tại |
|---|---|---|---|---|
| FR1 | US1 | UC1 | MUST | M1 — tra cứu tồn |
| FR2–FR4 | US2 | UC2 | MUST | M2 — giao dịch kho |
| FR5 | US3 | UC3 | MUST | M2 — giao dịch kho |
| FR6–FR7 | US4 | UC4–UC5 | SHOULD | M1 — tra cứu/lọc cảnh báo |
| FR8 | US5 | UC6 | SHOULD | M1 — thao tác ngưỡng theo quyền QLTT |
| FR9 | US2, US3 | UC2, UC3 | MUST | M2 — ghi giao dịch |
| FR10 | US6 | UC7 | SHOULD | M3 — tra cứu lịch sử |
| FR11 | US7 | UC8 | SHOULD | M3 — tra cứu theo phiếu |

UC9/US8 là chức năng COULD và được giữ ngoài phạm vi cốt lõi. Tên/mã màn hình trong bảng bám theo [`diagrams/wireframe.drawio`](diagrams/wireframe.drawio); báo cáo Word mô tả bộ ba màn hình khác, nên cần xác nhận bản wireframe nào là bản nộp chính thức.
