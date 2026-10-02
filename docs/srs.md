SRS rút gọn — Quản lý kho linh kiện thay thế (Luồng L5)
Sinh viên: Nguyễn Văn Chí · MSSV 2374802010056 · Track: SE

Học phần: Chuyên đề Tốt nghiệp 1, HK1 2026–2027

Case study: Smart CRM – Mekong Mobile

Chuẩn tham chiếu: SRS rút gọn theo tinh thần ISO/IEC/IEEE 29148; không tuyên bố tuân thủ đầy đủ chuẩn.
Nguồn: [CS] Case Study Smart CRM – Mekong Mobile · [B3] Buổi 3 · [B4] Buổi 4 · [BT1] Bài tập 1.

Các nội dung có ký hiệu [Gx] là giả định của tác giả và cần xác nhận khi triển khai.

1. Giới thiệu và phạm vi
1.1 Bối cảnh
Luồng L5 – Kho linh kiện thay thế tập trung vào theo dõi tồn kho linh kiện theo trung tâm bảo hành, ghi nhận nhập kho, xuất linh kiện cho phiếu bảo hành và cảnh báo khi tồn xuống dưới ngưỡng. Case Study xác định Kỹ thuật viên và Quản lý trung tâm là người dùng chính của luồng L5. [CS – L5]
1.2 Phạm vi
Hệ thống hỗ trợ quản lý kho linh kiện thay thế theo từng trung tâm bảo hành:
·	Kỹ thuật viên tra cứu tồn kho và ghi nhận xuất linh kiện cho phiếu bảo hành.
·	Quản lý trung tâm ghi nhận nhập kho, theo dõi cảnh báo và thiết lập ngưỡng cảnh báo.
·	Hệ thống kiểm tra số lượng tồn trước khi xuất và không cho phép xuất vượt tồn.
·	Hệ thống cập nhật giao dịch kho và cảnh báo khi số lượng tồn nhỏ hơn ngưỡng cảnh báo.
1.3 Ngoài phạm vi (WON'T)
·	Không quản lý khách hàng, đơn hàng, doanh thu, khảo sát hài lòng hoặc chức năng AI/dự báo.
·	Không thực hiện phân công kỹ thuật viên và lịch hẹn.
·	Không tạo, sửa hoặc tự chuyển trạng thái phiếu bảo hành; L5 chỉ đọc thông tin phiếu [G5].
·	Không quản lý nhà cung cấp hoặc đặt mua linh kiện.
·	Không quản lý tồn kho sản phẩm bán lẻ.
·	Không coi đăng nhập là một nghiệp vụ/use case của L5.
·	US8/UC9 xem danh sách phiếu chờ linh kiện được giữ ở mức COULD, không hiện thực trong prototype hiện tại.
1.4 Thuật ngữ
Thuật ngữ	Định nghĩa	Tên kỹ thuật
Linh kiện	Bộ phận thay thế dùng trong sửa chữa	part
Phiếu bảo hành	Phiếu yêu cầu bảo hành/sửa chữa	ticket
Trung tâm bảo hành	Nơi tiếp nhận, sửa chữa và giữ kho linh kiện	service_center
Tồn kho	Số lượng một linh kiện tại một trung tâm	part_stock.quantity
Ngưỡng cảnh báo	Mức tồn tối thiểu; tồn nhỏ hơn mức này thì cảnh báo	part_stock.min_threshold
Giao dịch kho	Một lần nhập hoặc xuất linh kiện	part_transaction
Liên kết linh kiện–phiếu	Thông tin linh kiện đã xuất cho phiếu	ticket_part


2. Các bên liên quan và vai trò người dùng
Actor	Được làm	Không được làm
Kỹ thuật viên	Tra cứu tồn kho của trung tâm mình; ghi nhận xuất kho cho phiếu; xem linh kiện đã xuất cho phiếu	Nhập kho; thiết lập ngưỡng; thao tác dữ liệu kho của trung tâm khác
Quản lý trung tâm	Tra cứu tồn; ghi nhận nhập kho; xem cảnh báo; thiết lập ngưỡng; xem lịch sử giao dịch trong trung tâm mình	Thao tác dữ liệu kho của trung tâm khác; sửa/xóa giao dịch đã ghi
Hệ thống phiếu bảo hành(actor phụ)	Cung cấp thông tin phiếu gồm mã phiếu, trung tâm và trạng thái cho nghiệp vụ xuất kho	Không thực hiện nghiệp vụ kho L5

Nguồn: [CS – L5, Bảng 2.1, QT-13, QT-14]. Phân quyền chi tiết có giả định [G1].

3. Yêu cầu chức năng
3.1 User Story và MoSCoW
Mã	User Story	MoSCoW
US1	Là Kỹ thuật viên, tôi muốn tra cứu số lượng tồn của linh kiện tại trung tâm tôi làm việc, để biết còn đủ linh kiện trước khi nhận sửa và hẹn khách.	MUST
US2	Là Kỹ thuật viên, tôi muốn ghi nhận xuất kho một linh kiện cho một phiếu bảo hành, để số lượng tồn được cập nhật đúng.	MUST
US3	Là Quản lý trung tâm, tôi muốn ghi nhận nhập kho linh kiện vào trung tâm của tôi, để số lượng tồn trên hệ thống khớp hàng thực nhận.	MUST
US4	Là Quản lý trung tâm, tôi muốn xem danh sách linh kiện có tồn dưới ngưỡng cảnh báo, để chủ động xử lý tình trạng thiếu linh kiện.	SHOULD
US5	Là Quản lý trung tâm, tôi muốn thiết lập ngưỡng cảnh báo riêng cho từng linh kiện, để mức cảnh báo phù hợp với nhu cầu dự trữ.	SHOULD
US6	Là Quản lý trung tâm, tôi muốn xem lịch sử giao dịch kho của linh kiện theo khoảng ngày, để đối chiếu khi cần.	SHOULD
US7	Là Kỹ thuật viên, tôi muốn xem các linh kiện đã xuất cho một phiếu bảo hành, để biết linh kiện đã sử dụng.	SHOULD
US8	Là Quản lý trung tâm, tôi muốn xem danh sách phiếu đang chờ linh kiện kèm linh kiện còn thiếu, để theo dõi các phiếu chưa đủ linh kiện.	COULD

Các User Story MUST được đặc tả tiêu chí chấp nhận GWT trong artifact User Story của Buổi 4; SRS này chỉ giữ phần tóm tắt và MoSCoW.
3.2 Yêu cầu chức năng (FR)
Mã	Yêu cầu chức năng
FR1	Hệ thống hiển thị danh sách linh kiện, số lượng tồn và ngưỡng cảnh báo tại trung tâm của người dùng; cho phép tìm theo mã hoặc tên linh kiện.
FR2	Hệ thống cho phép Kỹ thuật viên ghi nhận xuất kho với mã phiếu, mã linh kiện và số lượng; sau khi thành công, tồn giảm đúng bằng số lượng xuất.
FR3	Hệ thống từ chối xuất kho khi số lượng xuất lớn hơn số lượng tồn hiện tại và không thay đổi tồn.
FR4	Hệ thống chỉ chấp nhận xuất kho cho phiếu tồn tại, thuộc cùng trung tâm và đáp ứng điều kiện trạng thái theo quy định [G2].
FR5	Hệ thống cho phép Quản lý trung tâm ghi nhận nhập kho; tồn tăng đúng bằng số lượng nhập. Nếu chưa có dòng tồn, hệ thống tạo dòng tồn mới và yêu cầu ngưỡng cảnh báo [G3].
FR6	Sau giao dịch kho, hệ thống xác định trạng thái cảnh báo khi tồn nhỏ hơn ngưỡng; khi tồn ≥ ngưỡng thì không cảnh báo.
FR7	Hệ thống cho phép Quản lý trung tâm xem danh sách linh kiện đang cảnh báo của trung tâm, gồm mã, tên, tồn và ngưỡng.
FR8	Hệ thống cho phép Quản lý trung tâm thiết lập ngưỡng cảnh báo cho từng linh kiện tại trung tâm [G4].
FR9	Hệ thống lưu giao dịch kho gồm loại giao dịch, linh kiện, số lượng, thời điểm, người thực hiện và mã phiếu đối với xuất kho; giao dịch đã ghi không được sửa/xóa.
FR10	Hệ thống cho phép xem lịch sử giao dịch của linh kiện tại trung tâm và lọc theo khoảng ngày.
FR11	Hệ thống hiển thị các linh kiện đã xuất cho một phiếu bảo hành, gồm mã, tên, số lượng và thời điểm.
FR12	COULD – không hiện thực: Hệ thống hiển thị danh sách phiếu bảo hành đang chờ linh kiện kèm linh kiện còn thiếu.


4. Yêu cầu phi chức năng
Các ngưỡng dưới đây là ngưỡng đề xuất cho prototype, không phải số liệu bắt buộc được Case Study quy định.
Mã	Loại	Yêu cầu và ngưỡng	Cách kiểm chứng
NFR1	Hiệu năng	Tra cứu tồn kho phản hồi < 2 giây (P95) trong 20 lần đo với dữ liệu prototype.	Đo thời gian 20 lần
NFR2	Chính xác dữ liệu	100% dòng tồn được đối chiếu đúng với tổng nhập − tổng xuất; độ lệch cho phép 0.	Truy vấn đối chiếu dữ liệu
NFR3	Toàn vẹn	Với 2 yêu cầu xuất đồng thời khi tồn chỉ đủ cho 1, đúng 1 yêu cầu thành công; chạy 100 lần, có 0 lần tồn âm.	Kiểm thử đồng thời
NFR4	Phân quyền	100% yêu cầu đọc/ghi dữ liệu của trung tâm khác bị từ chối bằng HTTP 403.	Kiểm thử quyền với các trung tâm khác
NFR5	Khả dụng	Người dùng mới hoàn tất một lần xuất kho trong < 1 phút, tối đa 4 thao tác nhập liệu.	Bấm giờ người dùng thử


5. Ràng buộc và quy tắc nghiệp vụ
Mã	Quy tắc	Áp dụng
QT-09	Không được xuất vượt số lượng tồn. Tồn < ngưỡng thì cảnh báo; tồn = ngưỡng thì chưa cảnh báo.	FR3, FR6, FR7
QT-06	Việc xuất kho phải tuân theo điều kiện trạng thái phiếu; không áp dụng cho phiếu Đã đóng/Đã hủy [G2].	FR4
QT-13	Không xóa vật lý; giao dịch kho đã ghi không được sửa/xóa.	FR9
QT-14	Người dùng chỉ được xem/ghi dữ liệu kho thuộc trung tâm mình được phân quyền.	FR1–FR10, NFR4
QT-L5-1	Mỗi cặp (trung tâm, linh kiện) có một dòng tồn; số lượng tồn không âm.	FR2, FR5
QT-L5-2	Xuất kho phải gắn với mã phiếu và phiếu phải thuộc cùng trung tâm với giao dịch.	FR2, FR4
QT-L5-3	Số lượng của một giao dịch kho là số nguyên dương.	FR2, FR5

Giả định cần xác nhận
·	G1: Phân quyền nhập kho/thiết lập ngưỡng/xem cảnh báo/lịch sử thuộc Quản lý trung tâm; xuất kho thuộc Kỹ thuật viên.
·	G2: Chỉ xuất kho cho phiếu chưa Đã đóng/Đã hủy.
·	G3: Nếu chưa có dòng tồn, coi tồn ban đầu là 0 và tạo dòng tồn khi nhập kho.
·	G4: Ngưỡng cảnh báo là số nguyên ≥ 0.
·	G5: L5 chỉ đọc thông tin phiếu và không thay đổi trạng thái phiếu.

6. Bảng truy vết yêu cầu
FR	Tóm tắt	User Story	Use Case	MoSCoW
FR1	Tra cứu tồn theo trung tâm	US1	UC1	MUST
FR2	Ghi nhận xuất kho	US2	UC2	MUST
FR3	Từ chối xuất vượt tồn	US2	UC2	MUST
FR4	Kiểm tra phiếu khi xuất	US2	UC2	MUST
FR5	Ghi nhận nhập kho	US3	UC3	MUST
FR6	Xác định cảnh báo khi tồn < ngưỡng	US4	UC4	SHOULD
FR7	Xem danh sách cảnh báo	US4	UC5	SHOULD
FR8	Thiết lập ngưỡng cảnh báo	US5	UC6	SHOULD
FR9	Lưu giao dịch, không sửa/xóa	US2, US3	UC2, UC3	MUST
FR10	Xem lịch sử giao dịch	US6	UC7	SHOULD
FR11	Xem linh kiện đã xuất cho phiếu	US7	UC8	SHOULD
FR12	Xem phiếu chờ linh kiện	US8	UC9	COULD

Kiểm tra ngược: US1→FR1 · US2→FR2, FR3, FR4, FR9 · US3→FR5, FR9 · US4→FR6, FR7 · US5→FR8 · US6→FR10 · US7→FR11 · US8→FR12.
Kết quả: 8 User Story đều có FR; 12 FR đều có User Story, Use Case và MoSCoW; không để trống các cột truy vết bắt buộc.
