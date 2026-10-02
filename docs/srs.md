# SRS rút gọn – Quản lý kho linh kiện thay thế (Luồng L5)

> **Sinh viên:** Nguyễn Văn Chí  
> **MSSV:** 2374802010056  
> **Track:** SE  
> **Học phần:** Chuyên đề Tốt nghiệp 1 – HK1 2026–2027  
> **Case Study:** Smart CRM – Mekong Mobile

---

## 1. Giới thiệu và phạm vi

### 1.1. Bối cảnh

Luồng **L5 – Kho linh kiện thay thế** tập trung vào việc theo dõi tồn kho linh kiện theo từng trung tâm bảo hành, ghi nhận nhập kho, xuất linh kiện cho phiếu bảo hành và cảnh báo khi tồn kho xuống dưới ngưỡng.

Người dùng chính của luồng L5 gồm:

| Actor | Vai trò |
|---|---|
| **Kỹ thuật viên** | Tra cứu tồn kho và ghi nhận xuất linh kiện cho phiếu bảo hành |
| **Quản lý trung tâm** | Ghi nhận nhập kho, theo dõi tồn kho và quản lý ngưỡng cảnh báo |
| **Hệ thống phiếu bảo hành** | Cung cấp thông tin phiếu bảo hành phục vụ nghiệp vụ xuất linh kiện |

### 1.2. Phạm vi

Hệ thống hỗ trợ quản lý kho linh kiện thay thế theo từng trung tâm bảo hành:

- Kỹ thuật viên tra cứu tồn kho và ghi nhận xuất linh kiện cho phiếu bảo hành.
- Quản lý trung tâm ghi nhận nhập kho.
- Hệ thống kiểm tra số lượng tồn trước khi xuất.
- Không cho phép xuất số lượng lớn hơn tồn kho hiện tại.
- Cảnh báo khi số lượng tồn kho xuống dưới ngưỡng.

### 1.3. Ngoài phạm vi (WON'T)

Phiên bản hiện tại không triển khai:

- Quản lý nhà cung cấp.
- Quản lý mua hàng.
- Điều chuyển linh kiện giữa các trung tâm.
- Kiểm kê kho vật lý.
- Quản lý tài chính/kế toán.
- Xây dựng toàn bộ quy trình bảo hành.

### 1.4. Thuật ngữ

| Thuật ngữ | Ý nghĩa |
|---|---|
| **L5** | Luồng nghiệp vụ quản lý kho linh kiện thay thế |
| **KTV** | Kỹ thuật viên |
| **QLTT** | Quản lý trung tâm |
| **Tồn kho** | Số lượng linh kiện hiện có tại một trung tâm |
| **Ngưỡng cảnh báo** | Mức tồn tối thiểu dùng để xác định linh kiện cần cảnh báo |
| **Phiếu bảo hành** | Phiếu nghiệp vụ có thể phát sinh nhu cầu sử dụng linh kiện |

---

## 2. Actor và quyền sử dụng

| Mã | Actor | Chức năng chính |
|---|---|---|
| **ACT-01** | Kỹ thuật viên | Tra cứu tồn kho, xuất linh kiện cho phiếu bảo hành, xem linh kiện đã xuất |
| **ACT-02** | Quản lý trung tâm | Tra cứu tồn kho, nhập kho, xem cảnh báo, thiết lập ngưỡng và xem lịch sử giao dịch |
| **ACT-03** | Hệ thống phiếu bảo hành | Cung cấp thông tin phiếu bảo hành phục vụ kiểm tra khi xuất linh kiện |

---

## 3. Yêu cầu chức năng

### 3.1. User Story

| ID | Actor | User Story | Priority |
|---|---|---|:---:|
| **US-01** | Kỹ thuật viên | Tôi muốn tra cứu tồn kho linh kiện tại trung tâm để biết linh kiện còn khả dụng. | MUST |
| **US-02** | Kỹ thuật viên | Tôi muốn ghi nhận xuất linh kiện cho phiếu bảo hành để cập nhật việc sử dụng linh kiện. | MUST |
| **US-03** | Quản lý trung tâm | Tôi muốn ghi nhận nhập linh kiện để cập nhật số lượng tồn kho. | MUST |
| **US-04** | Quản lý trung tâm | Tôi muốn xem linh kiện dưới ngưỡng để chủ động theo dõi tình trạng thiếu linh kiện. | SHOULD |
| **US-05** | Quản lý trung tâm | Tôi muốn thiết lập ngưỡng cảnh báo cho linh kiện để hệ thống xác định mức tồn thấp. | SHOULD |
| **US-06** | Quản lý trung tâm | Tôi muốn xem lịch sử giao dịch kho để theo dõi biến động linh kiện. | SHOULD |
| **US-07** | Kỹ thuật viên | Tôi muốn xem các linh kiện đã xuất cho phiếu bảo hành để kiểm tra việc sử dụng linh kiện. | SHOULD |
| **US-08** | Quản lý trung tâm | Tôi muốn xem các phiếu bảo hành đang chờ linh kiện để hỗ trợ theo dõi xử lý. | COULD |

### 3.2. Functional Requirements

| ID | Yêu cầu chức năng |
|---|---|
| **FR-01** | Hệ thống cho phép tra cứu số lượng tồn kho của linh kiện theo trung tâm bảo hành. |
| **FR-02** | Hệ thống cho phép ghi nhận xuất linh kiện cho một phiếu bảo hành. |
| **FR-03** | Hệ thống phải từ chối giao dịch nếu số lượng xuất lớn hơn số lượng tồn hiện tại. |
| **FR-04** | Hệ thống kiểm tra thông tin phiếu bảo hành trước khi ghi nhận xuất linh kiện. |
| **FR-05** | Hệ thống cho phép Quản lý trung tâm ghi nhận nhập linh kiện vào kho. |
| **FR-06** | Hệ thống xác định trạng thái cảnh báo khi số lượng tồn thấp hơn ngưỡng cảnh báo. |
| **FR-07** | Hệ thống cho phép Quản lý trung tâm xem danh sách linh kiện đang dưới ngưỡng. |
| **FR-08** | Hệ thống cho phép Quản lý trung tâm thiết lập ngưỡng cảnh báo cho linh kiện. |
| **FR-09** | Hệ thống phải lưu giao dịch nhập/xuất kho sau khi giao dịch thành công. |
| **FR-10** | Hệ thống cho phép xem lịch sử giao dịch của linh kiện. |
| **FR-11** | Hệ thống cho phép Kỹ thuật viên xem các linh kiện đã xuất cho một phiếu bảo hành. |
| **FR-12** | Hệ thống có thể hỗ trợ xem danh sách phiếu bảo hành đang chờ linh kiện. |

---

## 4. Yêu cầu phi chức năng

| ID | Nhóm | Yêu cầu / Tiêu chí đo |
|---|---|---|
| **NFR-01** | Performance | Thời gian phản hồi của các chức năng tra cứu chính không vượt quá **2 giây ở P95** trong môi trường prototype. |
| **NFR-02** | Data Integrity | Sau giao dịch nhập/xuất thành công, số lượng tồn kho phải khớp **100%** với dữ liệu giao dịch đã ghi nhận. |
| **NFR-03** | Concurrency | Khi hai yêu cầu xuất đồng thời vượt khả năng tồn kho, hệ thống phải đảm bảo tồn kho không âm và chỉ giao dịch hợp lệ được ghi nhận. |
| **NFR-04** | Security | Người dùng không được đọc hoặc cập nhật dữ liệu kho thuộc trung tâm không có quyền truy cập; các yêu cầu không hợp lệ phải bị từ chối. |
| **NFR-05** | Usability | Người dùng mới có thể hoàn thành một thao tác xuất linh kiện trong **dưới 1 phút** với tối đa **4 thao tác nhập liệu chính**. |

> **Lưu ý:** Các ngưỡng NFR trên là tiêu chí đề xuất cho phạm vi prototype và cần được kiểm chứng trong quá trình triển khai/kiểm thử.

---

## 5. Business Rules và Constraints

| ID | Quy tắc |
|---|---|
| **BR-01** | Không được xuất số lượng linh kiện lớn hơn số lượng tồn kho hiện tại. |
| **BR-02** | Số lượng tồn kho không được nhỏ hơn `0`. |
| **BR-03** | Khi `quantity < min_threshold`, linh kiện được xác định là dưới ngưỡng cảnh báo. |
| **BR-04** | Mỗi cặp `center_id + part_id` chỉ có một bản ghi tồn kho. |
| **BR-05** | `part_code` phải duy nhất. |
| **BR-06** | Số lượng của giao dịch nhập/xuất phải là số nguyên dương. |
| **BR-07** | Giao dịch xuất linh kiện phải gắn với phiếu bảo hành hợp lệ. |
| **BR-08** | Giao dịch kho đã ghi nhận không được xóa vật lý nhằm bảo toàn lịch sử giao dịch. |

### 5.1. Giả định cần xác nhận

| ID | Giả định |
|---|---|
| **G1** | Người dùng chỉ thao tác dữ liệu thuộc trung tâm mà mình được phân quyền. |
| **G2** | Trạng thái phiếu bảo hành có thể ảnh hưởng đến quyền xuất linh kiện. |
| **G3** | Nếu chưa có bản ghi tồn kho của linh kiện tại trung tâm thì số lượng khả dụng được xem là `0`. |
| **G4** | Ngưỡng cảnh báo là số nguyên không âm. |
| **G5** | Luồng L5 chỉ sử dụng thông tin phiếu bảo hành cần thiết, không quản lý toàn bộ vòng đời phiếu bảo hành. |

---

## 6. Traceability

| FR | User Story | Use Case | MoSCoW |
|---|---|---|:---:|
| **FR-01** | US-01 | UC-01 – Tra cứu tồn kho linh kiện | MUST |
| **FR-02** | US-02 | UC-02 – Ghi nhận xuất kho linh kiện | MUST |
| **FR-03** | US-02 | UC-02 – Ghi nhận xuất kho linh kiện | MUST |
| **FR-04** | US-02 | UC-02 – Ghi nhận xuất kho linh kiện | MUST |
| **FR-05** | US-03 | UC-03 – Ghi nhận nhập kho linh kiện | MUST |
| **FR-06** | US-04 | UC-04 – Phát cảnh báo tồn dưới ngưỡng | SHOULD |
| **FR-07** | US-04 | UC-05 – Xem danh sách cảnh báo | SHOULD |
| **FR-08** | US-05 | UC-06 – Thiết lập ngưỡng cảnh báo | SHOULD |
| **FR-09** | US-02, US-03 | UC-02, UC-03 | MUST |
| **FR-10** | US-06 | UC-07 – Xem lịch sử giao dịch kho | SHOULD |
| **FR-11** | US-07 | UC-08 – Xem linh kiện đã xuất cho phiếu | SHOULD |
| **FR-12** | US-08 | UC-09 – Xem phiếu bảo hành chờ linh kiện | COULD |

**Kết quả truy vết:** Không có Functional Requirement nào thiếu liên kết User Story/Use Case.

---

## Tổng quan SRS

| Hạng mục | Kết quả |
|---|:---:|
| Cấu trúc SRS | **6/6 mục** |
| User Story | **8** |
| MUST User Story | **3** |
| Functional Requirement | **12 FR** |
| Non-functional Requirement | **5 NFR** |
| NFR có tiêu chí đo | **5/5** |
| Traceability | **Đã điền** |
| Luồng nghiệp vụ | **L5 – Kho linh kiện thay thế** |
| Track | **SE** |

---

> **Tài liệu:** SRS rút gọn – Smart CRM – Mekong Mobile  
> **Sinh viên:** Nguyễn Văn Chí – 2374802010056