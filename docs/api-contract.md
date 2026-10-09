# API contract đề xuất cho luồng L5

Tài liệu này mô tả hợp đồng API ở mức thiết kế BT1 để nối giao diện kho với dịch vụ nghiệp vụ. Đối chiếu chỉ đọc với `src/backend/server.js` cho thấy backend hiện chỉ có endpoint smoke test `/api/hello` và `/api/db-test`; các endpoint dưới đây chưa được triển khai. Cơ chế xác thực và API của hệ thống phiếu bảo hành cần được chốt với các hệ thống sở hữu trước khi hiện thực.

## Quy ước

- Tiền tố API: `/api`; request và response dùng JSON UTF-8, tên trường `snake_case`.
- Thời gian trả về theo ISO 8601 có múi giờ. Mã tiền tệ VND, nếu có, biểu diễn bằng số nguyên.
- Danh sách dùng `page` bắt đầu từ 1 (mặc định 1) và `size` từ 1 đến 100 (mặc định 20). Response danh sách có `items`, `page`, `size`, `total`.
- Endpoint yêu cầu người dùng đã xác thực. Quyền truy cập phải được kiểm tra ở máy chủ theo vai trò và trung tâm được cấp, không dựa vào lựa chọn trung tâm trên giao diện.
- KTV được tra cứu tồn, xuất kho và tra cứu linh kiện theo phiếu trong phạm vi được cấp. QLTT được tra cứu tồn, nhập kho, xem cảnh báo, đặt ngưỡng và xem lịch sử tại trung tâm được cấp.
- Lỗi dùng cấu trúc `{ "error": { "code": "...", "message": "...", "fields": {} } }`.
- Xuất kho cần xác minh mã phiếu, trung tâm và trạng thái qua hệ thống phiếu. Tên endpoint, giao thức, timeout và danh sách trạng thái hợp lệ chưa được xác nhận.

## Endpoint và truy vết

| Phương thức | Endpoint | Chức năng | Story / Use Case |
|---|---|---|---|
| `GET` | `/api/parts?center_id={id}&q={text}&page={n}&size={n}` | Tra cứu danh mục linh kiện cùng số lượng tồn và ngưỡng tại một trung tâm | US1 / UC1 |
| `POST` | `/api/stock/issues` | Xuất linh kiện cho phiếu bảo hành | US2 / UC2 |
| `POST` | `/api/stock/receipts` | Ghi nhận nhập kho | US3 / UC3 |
| `GET` | `/api/stock/alerts?center_id={id}&page={n}&size={n}` | Xem linh kiện dưới ngưỡng | US4 / UC5 |
| `PUT` | `/api/stock/thresholds` | Tạo hoặc cập nhật ngưỡng của cặp trung tâm/linh kiện | US5 / UC6 |
| `GET` | `/api/stock/transactions?center_id={id}&part_id={id}&type={type}&from={date}&to={date}&page={n}&size={n}` | Xem lịch sử giao dịch kho | US6 / UC7 |
| `GET` | `/api/tickets/{ticket_code}/parts?center_id={id}` | Xem linh kiện đã xuất cho phiếu | US7 / UC8 |

`UC4` xác định trạng thái cảnh báo từ số lượng và ngưỡng; trạng thái này có thể được trả về cùng dữ liệu tồn, không bắt buộc là một endpoint riêng.

## Chi tiết các request chính

Các payload và response dưới đây chỉ minh họa cấu trúc, không phải bản ghi được trích từ bộ dữ liệu.

### Tra cứu tồn kho

`center_id` là bắt buộc; `q` dùng tìm theo mã hoặc tên linh kiện.

```json
{
  "items": [
    {
      "part_id": 12,
      "part_code": "MH-SS-01",
      "part_name": "Màn hình Samsung loại 1",
      "center_id": 1,
      "quantity": 16,
      "min_threshold": 8,
      "is_below_threshold": false
    }
  ],
  "page": 1,
  "size": 20,
  "total": 1
}
```

Khi chưa có dòng tồn, thiết kế yêu cầu số lượng hiển thị bằng 0. Giá trị `min_threshold` khi chưa thiết lập đang là điểm cần chốt: SRS mô tả trạng thái chưa cấu hình, trong khi sơ đồ ERD biểu diễn ngưỡng là số nguyên không âm.

### Xuất kho

```json
{
  "center_id": 1,
  "part_id": 12,
  "ticket_code": "BH-000001/2025",
  "quantity": 1
}
```

Khi thành công, response cần cho biết mã giao dịch, loại `XUAT`, phiếu, trung tâm, linh kiện, số lượng, số lượng tồn sau giao dịch và thời điểm ghi nhận. Kiểm tra quyền, phiếu, tồn và ghi giao dịch/cập nhật tồn phải được xử lý ở phía máy chủ; nếu thất bại, không được để lại thay đổi một phần.

### Nhập kho

```json
{
  "center_id": 1,
  "part_id": 12,
  "quantity": 20,
  "reference": "PN-2026-0008"
}
```

Khi thành công, response cần cho biết mã giao dịch, loại `NHAP`, trung tâm, linh kiện, số lượng nhập, tồn sau giao dịch và thời điểm ghi nhận. Tạo dòng tồn lần đầu và cách lưu người thực hiện cần thống nhất với mô hình dữ liệu cuối cùng.

## Kiểm tra dữ liệu và lỗi

| Trường | Quy tắc đề xuất |
|---|---|
| `center_id`, `part_id` | Số nguyên dương, tồn tại; trung tâm phải nằm trong phạm vi quyền của người gọi. |
| `ticket_code` | Bắt buộc khi xuất; phải được hệ thống phiếu xác nhận. Độ dài và quy tắc định dạng cần đối chiếu nguồn tích hợp. |
| `quantity` | Số nguyên dương; xuất không được lớn hơn tồn khả dụng. |
| `min_threshold` | Số nguyên không âm. Quyết định có cho phép chưa thiết lập hay không cần được chốt trong ERD/DDL. |
| `reference` | Tùy chọn; giới hạn độ dài đề xuất 80 ký tự. |
| `type` | Chỉ nhận `NHAP` hoặc `XUAT`. |
| `from`, `to` | Ngày `YYYY-MM-DD`; nếu có cả hai thì `from <= to`. |
| `page`, `size` | `page >= 1`; `1 <= size <= 100`. |

| HTTP | Mã lỗi ví dụ | Tình huống |
|---|---|---|
| `400` | `VALIDATION_FAILED` | Thiếu trường hoặc sai kiểu/miền giá trị. |
| `401` | `UNAUTHENTICATED` | Chưa xác thực. |
| `403` | `FORBIDDEN` | Không có quyền thao tác hoặc truy cập trung tâm. |
| `404` | `PART_NOT_FOUND`, `CENTER_NOT_FOUND`, `TICKET_NOT_FOUND` | Không tìm thấy tài nguyên. |
| `409` | `INSUFFICIENT_STOCK`, `TICKET_CENTER_MISMATCH`, `TICKET_STATUS_NOT_ELIGIBLE` | Xung đột nghiệp vụ; tồn và lịch sử phải giữ nguyên. |
| `502` | `TICKET_SERVICE_UNAVAILABLE` | Dịch vụ phiếu không sẵn sàng; chỉ dùng sau khi thống nhất cách tích hợp. |
| `500` | `INTERNAL_ERROR` | Lỗi ngoài dự kiến; không ghi dở dang dữ liệu giao dịch. |

## Điểm cần xác nhận trước khi hiện thực

1. Nguồn token và claim vai trò/trung tâm; hệ thống nào chịu trách nhiệm xác thực.
2. API phiếu bảo hành, tập trạng thái cho phép xuất và hành vi khi dịch vụ phiếu không phản hồi.
3. Có lưu người thực hiện trong `part_transaction` hay không và khóa ngoại nào đại diện cho nhân viên.
4. Cách biểu diễn ngưỡng chưa thiết lập và dòng tồn chưa được tạo.
5. Ánh xạ endpoint và response vào cấu trúc bảng sau khi giải quyết khác biệt giữa báo cáo, ERD Draw.io và SQL DDL.
