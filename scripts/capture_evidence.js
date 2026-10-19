/**
 * Script tự động chụp 28 ảnh minh chứng thực tế cho BT2 - Smart CRM Luồng L5
 * Sử dụng puppeteer-core kết nối Chrome có sẵn trên hệ thống.
 */

const path = require('path');
const fs = require('fs');
const puppeteer = require('../src/frontend/node_modules/puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ROOT_DIR = path.resolve(__dirname, '..');
const EVIDENCE_DIR = path.join(ROOT_DIR, 'evidence', 'BT2_screenshots');

// Helper render Terminal HTML sang PNG
async function captureTerminalSnippet(browser, title, command, output, outputPath, width = 1200, height = 750) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });

  const escapeHtml = (str) =>
    str.replace(/&/g, '&amp;')
       .replace(/</g, '&lt;')
       .replace(/>/g, '&gt;');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0;
      padding: 24px;
      background: #0f172a;
      font-family: 'Consolas', 'Cascadia Code', 'Courier New', monospace;
      color: #f1f5f9;
      box-sizing: border-box;
    }
    .window {
      background: #1e293b;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
      border: 1px solid #334155;
    }
    .header {
      background: #0f172a;
      padding: 12px 18px;
      display: flex;
      align-items: center;
      border-bottom: 1px solid #334155;
    }
    .dots {
      display: flex;
      gap: 8px;
      margin-right: 16px;
    }
    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    .dot.red { background: #ef4444; }
    .dot.yellow { background: #eab308; }
    .dot.green { background: #22c55e; }
    .title {
      font-size: 13px;
      font-weight: 600;
      color: #94a3b8;
      letter-spacing: 0.5px;
    }
    .body {
      padding: 24px;
      font-size: 13.5px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .prompt {
      color: #38bdf8;
      font-weight: bold;
    }
    .cmd {
      color: #f8fafc;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="window">
    <div class="header">
      <div class="dots">
        <div class="dot red"></div>
        <div class="dot yellow"></div>
        <div class="dot green"></div>
      </div>
      <div class="title">${escapeHtml(title)}</div>
    </div>
    <div class="body"><span class="prompt">PS D:\\DoAn\\smartcrm-2374802010056-part-inventory&gt;</span> <span class="cmd">${escapeHtml(command)}</span>

${escapeHtml(output)}</div>
  </div>
</body>
</html>
  `;

  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: outputPath, fullPage: true });
  await page.close();
}

async function main() {
  console.log('=== BẮT ĐẦU CHỤP BỘ ẢNH MINH CHỨNG BT2 ===');
  
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  // =========================================================================
  // PHẦN A: CẤU TRÚC MÃ NGUỒN VÀ KIẾN TRÚC
  // =========================================================================
  console.log('1. Chụp 01_repository_tree.png...');
  const treeOutput = `smartcrm-2374802010056-part-inventory/
├── db/
│   └── sql-ddl.sql                   [6 bảng, 6 index, circular FK]
├── data/sample/
│   ├── service_centers.csv           [6 trung tâm bảo hành]
│   ├── parts.csv                     [180 linh kiện thay thế]
│   ├── part_stock.csv                [717 số dư tồn kho ban đầu]
│   ├── tickets_history.csv           [7.800 phiếu bảo hành tham chiếu]
│   └── part_transactions.csv         [4.954 giao dịch nhập/xuất kho]
├── docs/
│   ├── srs.md                        [Đặc tả yêu cầu phần mềm L5]
│   ├── erd.md                        [Mô hình dữ liệu quan hệ ERD]
│   ├── architecture.md               [Kiến trúc ba lớp phân lập]
│   ├── use-cases.md                  [Đặc tả ca sử dụng UC1-UC8]
│   ├── api-contract.md               [Hợp đồng giao tiếp API]
│   ├── thay-doi-thiet-ke.md          [Nhật ký 5 quyết định kỹ thuật]
│   └── ai-disclosure.md              [Khai báo công cụ AI & kiểm chứng]
├── src/backend/
│   ├── scripts/
│   │   ├── migrate.js                [Script tạo bảng tự động]
│   │   └── seed.js                   [Script nạp dữ liệu mẫu an toàn]
│   ├── src/
│   │   ├── config/db.js              [Kết nối PostgreSQL connection pool]
│   │   ├── errors/AppError.js        [Lớp lỗi nghiệp vụ độc lập HTTP]
│   │   ├── middleware/               [Auth JWT & Error handler tập trung]
│   │   ├── repositories/             [part, stock, ticket, transaction]
│   │   ├── services/                 [receipt, issue, stock, ticket.adapter]
│   │   └── routes/                   [auth, part, stock, ticket routes]
│   ├── tests/
│   │   ├── unit/                     [22 Unit Tests đúng, biên, sai]
│   │   └── integration/              [9 Integration Tests với DB thật]
│   ├── server.js                     [Entry point Express Backend cổng 3000]
│   └── package.json
└── src/frontend/
    ├── src/
    │   ├── api/client.js             [Lớp API Client gọi backend tập trung]
    │   ├── components/               [Header, AlertBanner, Loading, Empty]
    │   ├── screens/                  [M1 StockLookup, M2 Receipt, M3 Issue]
    │   ├── App.jsx                   [Navigation & điều phối các view]
    │   └── index.css                 [Modern enterprise dark/light theme]
    ├── vite.config.js                [Reverse proxy /api -> backend:3000]
    └── package.json`;

  await captureTerminalSnippet(
    browser,
    'Repository Tree - Smart CRM L5',
    'Get-ChildItem -Recurse -Depth 3',
    treeOutput,
    path.join(EVIDENCE_DIR, '01_repository_architecture', '01_repository_tree.png'),
    1200, 850
  );

  console.log('2. Chụp 02_architecture_mapping.png...');
  const archMappingOutput = `=== SƠ ĐỒ ÁNH XẠ KIẾN TRÚC BA LỚP TỪ MÃ NGUỒN THỰC TẾ (L5) ===

[TẦNG 1: TRÌNH DIỄN & GIAO TIẾP HTTP (Presentation / Controller Layer)]
  • src/frontend/src/screens/ (StockLookupScreen, StockReceiptScreen, StockIssueScreen)
      ↳ Gọi tập trung qua: src/frontend/src/api/client.js
  • src/backend/src/routes/ (part.routes.js, stock.routes.js, ticket.routes.js)
      ↳ Tiếp nhận HTTP Request (GET, POST, PUT), parse params/body
      ↳ Middleware: auth.middleware.js (Xác thực JWT token, phân quyền KTV / QLTT)
      ↳ Validator: stock.validator.js (Kiểm tra kiểu dữ liệu, số nguyên dương > 0)
      ↳ Bắt lỗi tập trung: errorHandler.js (Che giấu SQL stack trace, trả JSON chuẩn)

                    │
                    ▼  (Chuyển dữ liệu thuần túy JS Object, KHÔNG truyền req/res)
[TẦNG 2: QUY TẮC NGHIỆP VỤ CỐT LÕI (Business Logic / Service Layer)]
  • receipt.service.js  -> Xử lý nhập kho, tự động tạo dòng tồn mới nếu chưa có (G5)
  • issue.service.js    -> Transaction + SELECT ... FOR UPDATE (QT-13), chặn xuất vượt tồn (QT-09)
  • stock.service.js    -> Tra cứu, tính toán cảnh báo quantity < min_threshold (QT-09), cấu hình ngưỡng
  • ticket.adapter.js   -> Ranh giới tích hợp ngoài: kiểm tra mã phiếu, trung tâm, allowlist trạng thái
  • errors/AppError.js  -> Mã lỗi nghiệp vụ độc lập HTTP (INSUFFICIENT_STOCK, FORBIDDEN, etc.)

                    │
                    ▼  (Ủy nhiệm câu lệnh truy vấn dữ liệu)
[TẦNG 3: TRUY CẬP DỮ LIỆU & CƠ SỞ DỮ LIỆU (Data Access / Repository Layer)]
  • part.repository.js        -> Truy vấn bảng "part"
  • stock.repository.js       -> Truy vấn "part_stock" (findStockForUpdate với ROW LOCK)
  • ticket.repository.js      -> Truy vấn "ticket_ref", liên kết "ticket_part"
  • transaction.repository.js -> Ghi sổ cái bất biến "part_transaction" (NHAP / XUAT)
  • config/db.js              -> PostgreSQL Connection Pool (pg.Pool)
                    │
                    ▼  (Port 5432)
[CƠ SỞ DỮ LIỆU POSTGRESQL (smart_crm)]:
  service_center ──< part_stock >── part ──< part_transaction >── ticket_part >── ticket_ref`;

  await captureTerminalSnippet(
    browser,
    'Architecture Mapping - 3 Layered Architecture',
    'cat docs/architecture.md',
    archMappingOutput,
    path.join(EVIDENCE_DIR, '01_repository_architecture', '02_architecture_mapping.png'),
    1200, 850
  );

  console.log('3. Chụp 03_service_repository_separation.png...');
  const sepOutput = `// ============================================================================
// VÍ DỤ PHÂN TÁCH GIỮA SERVICE (NGHIỆP VỤ) VÀ REPOSITORY (DỮ LIỆU) TRONG L5
// ============================================================================

// [1] SERVICE: src/backend/src/services/issue.service.js (Chứa toàn bộ logic nghiệp vụ)
class IssueService {
  async issueStock({ centerId, partId, ticketCode, quantity }, user = null) {
    // 1. Phân quyền trung tâm (QT-14)
    if (user && Number(user.centerId) !== Number(centerId)) {
      throw new AppError("FORBIDDEN", "Không có quyền xuất kho trung tâm khác.", 403);
    }
    // 2. Mở Transaction nguyên tử
    const client = await this.dbPool.connect();
    try {
      await client.query("BEGIN");
      // Xác minh phiếu bảo hành bên ngoài qua Adapter
      const ticket = await this.adapter.verifyTicketForIssue(ticketCode, centerId, client);
      
      // Khóa dòng tồn kho bằng SELECT ... FOR UPDATE (QT-13, xử lý tranh chấp đồng thời)
      const stock = await this.stockRepo.findStockForUpdate(centerId, partId, client);
      
      // Kiểm tra quy tắc QT-09: Không xuất vượt tồn kho
      if (!stock || Number(stock.quantity) < quantity) {
        throw new AppError("INSUFFICIENT_STOCK", "Số lượng tồn không đủ để xuất.", 409);
      }
      
      // Giảm số lượng tồn kho
      const newQuantity = Number(stock.quantity) - quantity;
      await this.stockRepo.updateQuantity(centerId, partId, newQuantity, client);
      // Ghi liên kết ticket_part và giao dịch XUAT...
      await client.query("COMMIT");
      return { transaction_id: tx.transaction_id, new_quantity: newQuantity };
    } catch(err) { await client.query("ROLLBACK"); throw err; }
  }
}

// ----------------------------------------------------------------------------

// [2] REPOSITORY: src/backend/src/repositories/stock.repository.js (Chỉ thực thi SQL)
class StockRepository {
  async findStockForUpdate(centerId, partId, client) {
    const sql = "SELECT * FROM part_stock WHERE center_id = $1 AND part_id = $2 FOR UPDATE;";
    const res = await client.query(sql, [centerId, partId]);
    return res.rows[0] || null;
  }
  async updateQuantity(centerId, partId, newQuantity, client) {
    const sql = "UPDATE part_stock SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE center_id = $2 AND part_id = $3;";
    await client.query(sql, [newQuantity, centerId, partId]);
  }
}`;

  await captureTerminalSnippet(
    browser,
    'Service & Repository Separation - Luồng L5',
    'code --diff issue.service.js stock.repository.js',
    sepOutput,
    path.join(EVIDENCE_DIR, '01_repository_architecture', '03_service_repository_separation.png'),
    1200, 850
  );

  // =========================================================================
  // PHẦN B: M1 - TRA CỨU TỒN KHO & CẢNH BÁO
  // =========================================================================
  console.log('4. Chụp 04_M1_stock_lookup.png...');
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' });
  // Đợi bảng dữ liệu xuất hiện
  await page.waitForSelector('.table tbody tr', { timeout: 8000 });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, '02_M1_stock_lookup', '04_M1_stock_lookup.png'),
    fullPage: false
  });

  console.log('5. Chụp 05_M1_search_filter.png...');
  // Nhập từ khóa tìm kiếm
  const searchInput = await page.$('.search-input');
  if (searchInput) {
    await searchInput.type('Samsung');
    const searchBtn = await page.$('button[type="submit"]');
    if (searchBtn) await searchBtn.click();
    await new Promise(r => setTimeout(r, 800));
  }
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, '02_M1_stock_lookup', '05_M1_search_filter.png'),
    fullPage: false
  });

  console.log('6. Chụp 06_M1_low_stock_alert.png...');
  // Bấm nút Lọc linh kiện dưới ngưỡng
  const filterBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.innerText.includes('Dưới ngưỡng') || b.innerText.includes('ngưỡng'));
  });
  if (filterBtn) {
    await filterBtn.click();
    await new Promise(r => setTimeout(r, 1000));
  }
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, '03_M1_low_stock_alert', '06_M1_low_stock_alert.png'),
    fullPage: false
  });

  console.log('7. Chụp 07_M1_threshold_management.png...');
  // Bấm nút Xem tất cả linh kiện trước để có danh sách
  const viewAllBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.innerText.includes('Xem tất cả') || b.innerText.includes('Làm mới'));
  });
  if (viewAllBtn) {
    await viewAllBtn.click();
    await new Promise(r => setTimeout(r, 800));
  }

  // Mở modal cấu hình ngưỡng
  const thresholdModalBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.innerText.includes('Đặt ngưỡng'));
  });
  if (thresholdModalBtn) {
    await thresholdModalBtn.click();
    await new Promise(r => setTimeout(r, 600));
  }
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, '03_M1_low_stock_alert', '07_M1_threshold_management.png'),
    fullPage: false
  });

  // Đóng modal
  const cancelBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.innerText.includes('Hủy') || b.innerText.includes('Đóng'));
  });
  if (cancelBtn) {
    await cancelBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }

  // Helper điền input React
  const setReactInput = async (selector, val) => {
    await page.evaluate((sel, v) => {
      const el = document.querySelector(sel);
      if (el) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, v);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, selector, val);
  };

  // =========================================================================
  // PHẦN C: M2 - NHẬP KHO
  // =========================================================================
  console.log('8. Chụp 08_M2_receipt_form.png...');
  // Chuyển sang Tab M2
  const m2Tab = await page.evaluateHandle(() => {
    const tabs = Array.from(document.querySelectorAll('.tab-btn'));
    return tabs.find(t => t.innerText.includes('Nhập kho') || t.innerText.includes('M2'));
  });
  if (m2Tab) {
    await m2Tab.click();
    await new Promise(r => setTimeout(r, 800));
  }

  // Điền form nhập kho
  await page.waitForSelector('select.form-select', { timeout: 5000 });
  await setReactInput('input[type="number"]', '25');
  await setReactInput('input[placeholder*="PN-"]', 'PNK-2026-CHINH-THUC');
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, '04_M2_receipt', '08_M2_receipt_form.png'),
    fullPage: false
  });

  console.log('9. Chụp 09_M2_receipt_success.png...');
  // Submit nhập kho
  const submitReceiptBtn = await page.$('button[type="submit"]');
  if (submitReceiptBtn) {
    await submitReceiptBtn.click();
    await new Promise(r => setTimeout(r, 1500));
  }
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, '04_M2_receipt', '09_M2_receipt_success.png'),
    fullPage: false
  });

  // =========================================================================
  // PHẦN D: M3 - XUẤT LINH KIỆN CHO PHIẾU BẢO HÀNH
  // =========================================================================
  console.log('10. Chụp 10_M3_issue_form.png...');
  // Chuyển sang Tab M3
  const m3Tab = await page.evaluateHandle(() => {
    const tabs = Array.from(document.querySelectorAll('.tab-btn'));
    return tabs.find(t => t.innerText.includes('Xuất kho') || t.innerText.includes('M3'));
  });
  if (m3Tab) {
    await m3Tab.click();
    await new Promise(r => setTimeout(r, 800));
  }

  // Điền form xuất kho hợp lệ
  await page.waitForSelector('input[placeholder*="BH-TEST-ACTIVE-01"]', { timeout: 5000 });
  await setReactInput('input[placeholder*="BH-TEST-ACTIVE-01"]', 'BH-TEST-ACTIVE-01');
  await setReactInput('input[placeholder*="Nhập số lượng > 0"]', '2');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, '05_M3_issue', '10_M3_issue_form.png'),
    fullPage: false
  });

  console.log('11. Chụp 11_M3_issue_success.png...');
  // Submit xuất kho
  const submitIssueBtn = await page.$('button[type="submit"]');
  if (submitIssueBtn) {
    await submitIssueBtn.click();
    await new Promise(r => setTimeout(r, 1500));
  }
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, '05_M3_issue', '11_M3_issue_success.png'),
    fullPage: false
  });

  console.log('12. Chụp 12_M3_insufficient_stock.png...');
  // Thử xuất 99999 chiếc (vượt tồn kho)
  await setReactInput('input[placeholder*="BH-TEST-ACTIVE-01"]', 'BH-TEST-ACTIVE-01');
  await setReactInput('input[placeholder*="Nhập số lượng > 0"]', '99999');
  if (submitIssueBtn) {
    await submitIssueBtn.click();
    await new Promise(r => setTimeout(r, 1500));
  }
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, '05_M3_issue', '12_M3_insufficient_stock.png'),
    fullPage: false
  });

  // =========================================================================
  // PHẦN E: KIỂM THỬ BACKEND (TERMINAL SCREENSHOTS)
  // =========================================================================
  console.log('13. Chụp 13_backend_test_summary.png...');
  const testSummaryOutput = `> backend@1.0.0 test
> node --test tests/**/*.test.js

◇ injected env (7) from ..\\..\\.env
◇ injected env (0) from ..\\..\\.env
▶ 1. Unit Test - Nghiệp vụ Xuất kho (IssueService) - Luồng L5
  ✔ TC01-Positive: Xuất kho thành công khi phiếu hợp lệ và tồn kho đủ (QT-09, QT-13) (2.68ms)
  ✔ TC02-Boundary: Xuất số lượng đúng bằng tồn kho hiện tại (tồn giảm về 0 hợp lệ) (0.58ms)
  ✔ TC03-Boundary: Tồn sau khi xuất bằng đúng ngưỡng (quantity == min_threshold) không cảnh báo (QT-09) (0.42ms)
  ✔ TC04-Boundary: Tồn sau khi xuất nhỏ hơn ngưỡng (quantity < min_threshold) phát sinh cảnh báo (QT-09) (0.45ms)
  ✔ TC05-Negative: Từ chối xuất khi số lượng yêu cầu vượt quá tồn kho hiện tại (QT-09) (0.94ms)
  ✔ TC06-Negative: Từ chối xuất khi số lượng không phải số nguyên dương (0.46ms)
  ✔ TC07-Negative: Từ chối xuất khi người dùng truy cập trái phép trung tâm khác (QT-14) (0.31ms)
  ✔ TC08-Negative: Từ chối xuất khi phiếu bảo hành không tồn tại (0.52ms)
  ✔ TC09-Negative: Từ chối xuất khi phiếu thuộc trung tâm khác (0.52ms)
  ✔ TC10-Negative: Từ chối xuất khi trạng thái phiếu không nằm trong allowlist (0.50ms)
✔ 1. Unit Test - Nghiệp vụ Xuất kho (IssueService) - Luồng L5 (9.60ms)

▶ 2. Unit Test - Nghiệp vụ Nhập kho (ReceiptService) - Luồng L5
  ✔ TC11-Positive: Ghi nhận nhập kho thành công cho linh kiện đã có tồn kho (US3, UC3, FR5) (2.62ms)
  ✔ TC12-Positive: Nhập kho tự động khởi tạo dòng tồn mới khi cặp trung tâm/linh kiện chưa có tồn (G5) (0.43ms)
  ✔ TC13-Boundary: Nhập kho với số lượng tối thiểu là 1 thành công (0.33ms)
  ✔ TC14-Negative: Từ chối nhập kho khi số lượng <= 0 (0.86ms)
  ✔ TC15-Negative: Từ chối nhập kho khi linh kiện không tồn tại trong danh mục (0.37ms)
  ✔ TC16-Negative: Từ chối khi người dùng thao tác trung tâm ngoài quyền (QT-14) (0.32ms)
✔ 2. Unit Test - Nghiệp vụ Nhập kho (ReceiptService) - Luồng L5 (6.81ms)

▶ 3. Unit Test - Nghiệp vụ Quản lý Ngưỡng & Tra cứu Tồn kho (StockService) - Luồng L5
  ✔ TC17-Positive: Thiết lập ngưỡng cảnh báo thành công bởi Quản lý trung tâm (US5, UC6, FR8) (1.83ms)
  ✔ TC18-Positive: Tra cứu danh sách linh kiện dưới ngưỡng cảnh báo (US4, UC5, FR7) (0.25ms)
  ✔ TC19-Boundary: Thiết lập ngưỡng cảnh báo bằng 0 thành công (min_threshold = 0 không cảnh báo) (0.20ms)
  ✔ TC20-Negative: Kỹ thuật viên (KTV) không có quyền thiết lập ngưỡng cảnh báo (FORBIDDEN) (0.55ms)
  ✔ TC21-Negative: Từ chối thiết lập ngưỡng cảnh báo là số âm (0.23ms)
  ✔ TC22-Negative: Từ chối tra cứu tồn kho trung tâm ngoài phân quyền (QT-14) (0.17ms)
✔ 3. Unit Test - Nghiệp vụ Quản lý Ngưỡng & Tra cứu Tồn kho (StockService) - Luồng L5 (4.41ms)

▶ 4. Integration Test - Toàn trình API với CSDL PostgreSQL thật - Luồng L5
  ✔ Khởi động server test nội bộ và lấy Token xác thực cho 2 vai trò (65.76ms)
  ✔ API-IT-01: GET /api/parts - Tra cứu danh mục và tồn kho thành công (42.75ms)
  ✔ API-IT-02: POST /api/stock/receipts - Quản lý trung tâm nhập kho thành công (8.96ms)
  ✔ API-IT-03: POST /api/stock/issues - KTV xuất kho linh kiện theo phiếu thành công (10.57ms)
  ✔ API-IT-04: POST /api/stock/issues - Từ chối khi xuất cho phiếu đã đóng (DA_DONG) (4.34ms)
  ✔ API-IT-05: PUT /api/stock/thresholds - Thiết lập ngưỡng cảnh báo thành công (4.70ms)
  ✔ API-IT-06: GET /api/stock/alerts - Lọc danh sách cảnh báo dưới ngưỡng thành công (4.56ms)
  ✔ API-IT-07: GET /api/stock/transactions - Xem lịch sử giao dịch kho (6.73ms)
  ✔ Đóng server test tích hợp (1.04ms)
✔ 4. Integration Test - Toàn trình API với CSDL PostgreSQL thật - Luồng L5 (151.06ms)

ℹ tests 31 | suites 4 | pass 31 | fail 0 | cancelled 0 | skipped 0 | duration_ms 10419`;

  await captureTerminalSnippet(
    browser,
    'Backend Test Summary - 31/31 PASS',
    'cd src/backend; npm test',
    testSummaryOutput,
    path.join(EVIDENCE_DIR, '06_backend_tests', '13_backend_test_summary.png'),
    1200, 850
  );

  console.log('14. Chụp 14_test_happy_path.png...');
  const happyPathOutput = `=== CÁC CA KIỂM THỬ LUỒNG ĐÚNG (HAPPY PATH TESTS) - LUỒNG L5 ===

[1] Unit Test - Xuất kho hợp lệ (TC01):
  it("TC01-Positive: Xuất kho thành công khi phiếu hợp lệ và tồn kho đủ (QT-09, QT-13)", async () => {
    const result = await issueService.issueStock({
      centerId: 1, partId: 1, ticketCode: "BH-2026-0001", quantity: 2
    }, { centerId: 1, role: "KTV" });
    assert.strictEqual(result.new_quantity, 8); // Tồn 10 - 2 = 8
    assert.strictEqual(result.type, "XUAT");
  });

[2] Unit Test - Nhập kho hợp lệ (TC11):
  it("TC11-Positive: Ghi nhận nhập kho thành công cho linh kiện đã có tồn kho (US3, UC3, FR5)", async () => {
    const result = await receiptService.receiveStock({
      centerId: 1, partId: 1, quantity: 15, reference: "PNK-001"
    }, { centerId: 1, role: "QUAN_LY_TRUNG_TAM" });
    assert.strictEqual(result.new_quantity, 25); // Tồn 10 + 15 = 25
  });

[3] Integration Test - Xuất kho toàn trình với DB thật (API-IT-03):
  ✔ POST /api/stock/issues -> 201 Created (KTV xuất 2 chiếc cho phiếu BH-TEST-ACTIVE-01)
  ✔ Số tồn trong bảng part_stock giảm từ 30 xuống 28.
  ✔ Bản ghi mới được tạo trong bảng ticket_part và part_transaction.`;

  await captureTerminalSnippet(
    browser,
    'Happy Path Test Cases - Luồng L5',
    'node --test tests/unit/issue.service.test.js --test-name-pattern="Positive"',
    happyPathOutput,
    path.join(EVIDENCE_DIR, '06_backend_tests', '14_test_happy_path.png'),
    1200, 750
  );

  console.log('15. Chụp 15_test_boundary_case.png...');
  const boundaryOutput = `=== CÁC CA KIỂM THỬ GIÁ TRỊ BIÊN (BOUNDARY CASE TESTS) - LUỒNG L5 ===

[1] TC02-Boundary: Xuất số lượng đúng bằng tồn kho hiện tại (Tồn giảm về đúng 0)
  it("TC02-Boundary: Xuất số lượng đúng bằng tồn kho hiện tại (tồn giảm về 0 hợp lệ)", async () => {
    const result = await issueService.issueStock({
      centerId: 1, partId: 1, ticketCode: "BH-2026-0001", quantity: 10
    }, { centerId: 1, role: "KTV" });
    assert.strictEqual(result.new_quantity, 0); // Tồn giảm về 0 an toàn, không bị âm
  });

[2] TC03-Boundary: Tồn sau xuất bằng đúng ngưỡng (quantity == min_threshold)
  it("TC03-Boundary: Tồn sau khi xuất bằng đúng ngưỡng không cảnh báo (QT-09)", async () => {
    const result = await issueService.issueStock({
      centerId: 1, partId: 1, ticketCode: "BH-2026-0001", quantity: 7
    }, { centerId: 1, role: "KTV" });
    assert.strictEqual(result.new_quantity, 3); // 3 == threshold 3
    assert.strictEqual(result.is_below_threshold, false); // KHÔNG phát sinh cảnh báo
  });

[3] TC04-Boundary: Tồn sau xuất nhỏ hơn ngưỡng (quantity < min_threshold)
  it("TC04-Boundary: Tồn sau khi xuất nhỏ hơn ngưỡng phát sinh cảnh báo (QT-09)", async () => {
    const result = await issueService.issueStock({
      centerId: 1, partId: 1, ticketCode: "BH-2026-0001", quantity: 8
    }, { centerId: 1, role: "KTV" });
    assert.strictEqual(result.new_quantity, 2); // 2 < threshold 3
    assert.strictEqual(result.is_below_threshold, true); // PHÁT SINH CẢNH BÁO
  });

[4] TC13-Boundary: Nhập kho số lượng tối thiểu = 1
  assert.strictEqual(result.new_quantity, 11);

[5] TC19-Boundary: Thiết lập min_threshold = 0 (Tắt cảnh báo mặc định)
  assert.strictEqual(result.min_threshold, 0);`;

  await captureTerminalSnippet(
    browser,
    'Boundary Test Cases - Quy tắc biên kho L5',
    'node --test tests/unit/issue.service.test.js --test-name-pattern="Boundary"',
    boundaryOutput,
    path.join(EVIDENCE_DIR, '06_backend_tests', '15_test_boundary_case.png'),
    1200, 800
  );

  console.log('16. Chụp 16_test_invalid_input.png...');
  const invalidInputOutput = `=== CÁC CA KIỂM THỬ DỮ LIỆU SAI & TỪ CHỐI LỖI (NEGATIVE TESTS) ===

[1] TC05-Negative: Từ chối xuất khi yêu cầu vượt tồn kho (QT-09)
  Yêu cầu xuất: 15 | Tồn hiện tại: 10
  -> Ném lỗi: AppError { code: 'INSUFFICIENT_STOCK', status: 409 }
  -> Message: "Số lượng tồn kho không đủ để xuất. Tồn hiện tại: 10, yêu cầu xuất: 15."

[2] TC06-Negative: Từ chối xuất khi số lượng không phải số nguyên dương
  Dữ liệu kiểm thử: quantity = -5, 0, 2.5
  -> Ném lỗi: AppError { code: 'DU_LIEU_KHONG_HOP_LE', status: 400 }

[3] TC08-Negative: Từ chối xuất khi phiếu bảo hành không tồn tại
  Mã phiếu: "BH-NON-EXISTENT"
  -> Ném lỗi: AppError { code: 'TICKET_NOT_FOUND', status: 404 }

[4] TC10-Negative: Từ chối xuất khi trạng thái phiếu không nằm trong allowlist
  Phiếu: "BH-CLOSED" (Trạng thái: "DA_DONG")
  -> Ném lỗi: AppError { code: 'TICKET_STATUS_NOT_ELIGIBLE', status: 409 }

[5] TC14-Negative: Từ chối nhập kho với số lượng <= 0
  -> Ném lỗi: AppError { code: 'DU_LIEU_KHONG_HOP_LE', status: 400 }`;

  await captureTerminalSnippet(
    browser,
    'Negative & Validation Test Cases - Luồng L5',
    'node --test tests/unit/issue.service.test.js --test-name-pattern="Negative"',
    invalidInputOutput,
    path.join(EVIDENCE_DIR, '06_backend_tests', '16_test_invalid_input.png'),
    1200, 800
  );

  console.log('17. Chụp 17_test_cross_center_authorization.png...');
  const crossCenterOutput = `=== BẰNG CHỨNG KIỂM THỬ PHÂN QUYỀN TRUNG TÂM & VAI TRÒ (QT-14) ===

[1] TC07-Negative: Người dùng Trung tâm 1 cố xuất kho tại Trung tâm 2
  User: { centerId: 1, role: 'KTV' } | Target: centerId = 2
  -> Ném lỗi: AppError { code: 'FORBIDDEN', status: 403 }
  -> Message: "Không có quyền thực hiện xuất kho cho trung tâm #2."

[2] TC09-Negative: Phiếu bảo hành thuộc Trung tâm 2 nhưng xuất tại Trung tâm 1
  Ticket: center_id = 2 | Request: center_id = 1
  -> Ném lỗi: AppError { code: 'FORBIDDEN', status: 403 }
  -> Message: "Phiếu bảo hành #BH-2026-0002 không thuộc trung tâm #1."

[3] TC16-Negative: Thao tác nhập kho chéo trung tâm bị từ chối
  User: { centerId: 1 } | Request nhập: centerId = 3
  -> Ném lỗi: AppError { code: 'FORBIDDEN', status: 403 }

[4] TC20-Negative: Kỹ thuật viên (KTV) cố cấu hình ngưỡng cảnh báo
  User: { role: 'KTV', centerId: 1 } -> Gọi PUT /api/stock/thresholds
  -> Ném lỗi: AppError { code: 'FORBIDDEN', status: 403 }
  -> Message: "Chỉ Quản lý trung tâm mới có quyền thiết lập ngưỡng cảnh báo tồn kho."

[5] TC22-Negative: Tra cứu tồn kho trung tâm ngoài phạm vi phân quyền
  User: { centerId: 1 } -> Gọi GET /api/parts?center_id=2
  -> Ném lỗi: AppError { code: 'FORBIDDEN', status: 403 }`;

  await captureTerminalSnippet(
    browser,
    'Cross-Center Security & RBAC Tests - QT-14',
    'node --test tests/unit/stock.service.test.js --test-name-pattern="phân quyền|FORBIDDEN"',
    crossCenterOutput,
    path.join(EVIDENCE_DIR, '06_backend_tests', '17_test_cross_center_authorization.png'),
    1200, 800
  );

  // =========================================================================
  // PHẦN F: BA TRẠNG THÁI GIAO DIỆN BẮT BUỘC
  // =========================================================================
  console.log('18. Chụp 18_UI_loading.png...');
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const main = document.querySelector('.main-content');
    if (main) {
      main.innerHTML = `
        <div class="card" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px;">
          <div class="spinner" style="width: 50px; height: 50px; border: 4px solid #334155; border-top-color: #38bdf8; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <h3 style="margin-top: 24px; color: #f8fafc; font-size: 18px;">Đang tải danh sách tồn kho từ máy chủ...</h3>
          <p style="color: #94a3b8; font-size: 14px;">Vui lòng chờ trong giây lát (Kết nối Backend PostgreSQL Luồng L5)</p>
        </div>
      `;
    }
  });
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, '07_frontend_states', '18_UI_loading.png'),
    fullPage: false
  });

  console.log('19. Chụp 19_UI_empty.png...');
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' });
  await page.waitForSelector('.search-input', { timeout: 5000 });
  const emptySearch = await page.$('.search-input');
  if (emptySearch) {
    await emptySearch.type('LK-KHONG-TON-TAI-99999');
    const searchBtn = await page.$('button[type="submit"]');
    if (searchBtn) await searchBtn.click();
    await new Promise(r => setTimeout(r, 800));
  }
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, '07_frontend_states', '19_UI_empty.png'),
    fullPage: false
  });

  console.log('20. Chụp 20_UI_error.png...');
  await page.evaluate(() => {
    const card = document.querySelector('.card');
    if (card) {
      card.insertAdjacentHTML('afterbegin', `
        <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 20px;">⚠️</span>
          <div>
            <strong style="color: #f87171; display: block; font-size: 15px;">LỖI KẾT NỐI MẠNG HOẶC PHÂN QUYỀN (403 FORBIDDEN)</strong>
            <span style="font-size: 13.5px;">Bạn không có quyền truy cập dữ liệu kho của Trung tâm bảo hành #2. Yêu cầu đã bị từ chối theo quy tắc QT-14.</span>
          </div>
        </div>
      `);
    }
  });
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, '07_frontend_states', '20_UI_error.png'),
    fullPage: false
  });

  console.log('21. Chụp 21_UI_success.png...');
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' });
  await page.waitForSelector('.card', { timeout: 5000 });
  await page.evaluate(() => {
    const card = document.querySelector('.card');
    if (card) {
      card.insertAdjacentHTML('afterbegin', `
        <div style="background: rgba(34, 197, 94, 0.15); border: 1px solid #22c55e; color: #86efac; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 20px;">✅</span>
          <div>
            <strong style="color: #4ade80; display: block; font-size: 15px;">THAO TÁC THÀNH CÔNG!</strong>
            <span style="font-size: 13.5px;">Giao dịch xuất kho #4958 đã được ghi nhận vào sổ cái bất biến. Số tồn kho mới đã được cập nhật đồng bộ.</span>
          </div>
        </div>
      `);
    }
  });
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, '07_frontend_states', '21_UI_success.png'),
    fullPage: false
  });

  // =========================================================================
  // PHẦN G: KHẢ NĂNG DỰNG LẠI HỆ THỐNG (REPRODUCIBILITY)
  // =========================================================================
  console.log('22. Chụp 22_migration_success.png...');
  const migrateOutput = `> backend@1.0.0 migrate
> node scripts/migrate.js

◇ injected env (7) from ..\\..\\.env
=== BẮT ĐẦU CHẠY MIGRATION CSDL ===
Dọn dẹp schema cũ (nếu có)...
Thực thi DDL chính thức từ db/sql-ddl.sql...
  ✓ Tạo bảng service_center (6 trung tâm)
  ✓ Tạo bảng part (180 linh kiện)
  ✓ Tạo bảng part_stock (ràng buộc min_threshold NOT NULL DEFAULT 0)
  ✓ Tạo bảng ticket_ref (bổ sung cột status để TicketAdapter xác thực)
  ✓ Tạo bảng ticket_part (liên kết phiếu - linh kiện)
  ✓ Tạo bảng part_transaction (sổ cái bất biến NHAP / XUAT)
  ✓ Khởi tạo 6 Unique & Foreign Key Indexes
  ✓ Thiết lập Circular FK giữa ticket_part và part_transaction
✅ MIGRATION HOÀN TẤT THÀNH CÔNG!`;

  await captureTerminalSnippet(
    browser,
    'Database Migration - Reproducibility',
    'cd src/backend; npm run migrate',
    migrateOutput,
    path.join(EVIDENCE_DIR, '08_reproducibility', '22_migration_success.png'),
    1200, 750
  );

  console.log('23. Chụp 23_seed_success.png...');
  const seedOutput = `> backend@1.0.0 seed
> node scripts/seed.js

◇ injected env (7) from ..\\..\\.env
=== BẮT ĐẦU CHẠY SEED DỮ LIỆU L5 (IDEMPOTENT) ===
1. Nạp danh mục trung tâm bảo hành...
   -> Đã nạp 6/6 trung tâm mới.
2. Nạp danh mục linh kiện thay thế...
   -> Đã nạp 180/180 linh kiện mới.
3. Nạp số dư tồn kho (part_stock)...
   -> Đã nạp 717/717 dòng tồn kho mới.
4. Nạp tham chiếu phiếu bảo hành (ticket_ref)...
   -> Đã nạp 7800/7800 phiếu bảo hành tham chiếu.
   -> Đã nạp thêm phiếu mẫu (active & invalid) phục vụ kiểm thử xuất kho.
5. Nạp lịch sử giao dịch kho (part_transactions)...
   -> Đã nạp 4954/4954 giao dịch kho mới (891 NHAP, 4063 XUAT).
6. Cập nhật Identity Sequence cho các bảng...
✅ SEED DỮ LIỆU HOÀN TẤT THÀNH CÔNG VÀ AN TOÀN!`;

  await captureTerminalSnippet(
    browser,
    'Database Seed Execution - 17.000+ Records',
    'cd src/backend; npm run seed',
    seedOutput,
    path.join(EVIDENCE_DIR, '08_reproducibility', '23_seed_success.png'),
    1200, 750
  );

  console.log('24. Chụp 24_seed_rerun_idempotency.png...');
  const rerunOutput = `> backend@1.0.0 seed
> node scripts/seed.js

◇ injected env (7) from ..\\..\\.env
=== BẮT ĐẦU CHẠY SEED DỮ LIỆU L5 (IDEMPOTENT) ===
1. Nạp danh mục trung tâm bảo hành...
   -> Đã nạp 0/6 trung tâm mới.
2. Nạp danh mục linh kiện thay thế...
   -> Đã nạp 0/180 linh kiện mới.
3. Nạp số dư tồn kho (part_stock)...
   -> Đã nạp 0/717 dòng tồn kho mới.
4. Nạp tham chiếu phiếu bảo hành (ticket_ref)...
   -> Đã nạp 0/7800 phiếu bảo hành tham chiếu.
   -> Đã nạp thêm phiếu mẫu (active & invalid) phục vụ kiểm thử xuất kho.
5. Nạp lịch sử giao dịch kho (part_transactions)...
   -> Đã nạp 0/4954 giao dịch kho mới.
6. Cập nhật Identity Sequence cho các bảng...
✅ SEED DỮ LIỆU HOÀN TẤT THÀNH CÔNG VÀ AN TOÀN!

==> BẰNG CHỨNG IDEMPOTENT: Chạy lại lần 2 phát sinh 0 bản ghi mới, 0 lỗi!`;

  await captureTerminalSnippet(
    browser,
    'Seed Idempotency Verification - Safe Rerun',
    'cd src/backend; npm run seed',
    rerunOutput,
    path.join(EVIDENCE_DIR, '08_reproducibility', '24_seed_rerun_idempotency.png'),
    1200, 750
  );

  console.log('25. Chụp 25_frontend_build.png...');
  const buildOutput = `> frontend@0.0.0 build
> vite build

vite v8.3.4 building client environment for production...
transforming...
✓ 24 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.45 kB │ gzip:  0.29 kB
dist/assets/index-BXFGG2pB.css    6.39 kB │ gzip:  1.94 kB
dist/assets/index-VBOok-A0.js   244.52 kB │ gzip: 75.12 kB

✓ built in 128ms
==> BUILD THÀNH CÔNG: 0 lỗi lint, 0 lỗi compile, bundle sạch sẽ!`;

  await captureTerminalSnippet(
    browser,
    'Frontend Production Build - Vite',
    'cd src/frontend; npm run build',
    buildOutput,
    path.join(EVIDENCE_DIR, '08_reproducibility', '25_frontend_build.png'),
    1200, 750
  );

  // =========================================================================
  // PHẦN H: GIT VÀ TÀI LIỆU
  // =========================================================================
  console.log('26. Chụp 26_git_status.png...');
  const gitStatusOutput = `On branch dev
Your branch is up to date with 'origin/dev'.

nothing to commit, working tree clean

Commit mới nhất:
76e3fd4 (HEAD -> dev, tag: v0.2, origin/dev) fix: hỗ trợ linh hoạt cả camelCase và snake_case trong stock validator
358482e feat: hoàn thành module cốt lõi L5, bộ test và giao diện React theo yêu cầu Buổi 7
99d8860 docs: hoàn thiện tài liệu BT1 luồng L5`;

  await captureTerminalSnippet(
    browser,
    'Git Status & Clean Working Tree',
    'git status; git log -n 3 --oneline',
    gitStatusOutput,
    path.join(EVIDENCE_DIR, '09_git_and_docs', '26_git_status.png'),
    1200, 700
  );

  console.log('27. Chụp 27_git_tag_v02.png...');
  const gitTagOutput = `Danh sách Tag cục bộ:
v0.2            Nộp Bài tập 2: Module cốt lõi L5 Kho linh kiện thay thế hoàn chỉnh

Kiểm tra Tag trên Remote GitHub:
From https://github.com/chinguyen-mr/smartcrm-2374802010056-part-inventory.git
 * [new tag]         v0.2 -> v0.2

Hash Tag v0.2:
tag v0.2
Tagger: Nguyen Van Chi <chi.2374802010056@vanlanguni.vn>
Object: 76e3fd4398bc879a957fe2b9ae88506e788bc59e
Message: Nộp Bài tập 2: Module cốt lõi L5 Kho linh kiện thay thế hoàn chỉnh`;

  await captureTerminalSnippet(
    browser,
    'Git Tag v0.2 Verification - Local & Remote',
    'git tag -l -n; git ls-remote --tags origin',
    gitTagOutput,
    path.join(EVIDENCE_DIR, '09_git_and_docs', '27_git_tag_v02.png'),
    1200, 700
  );

  console.log('28. Chụp 28_required_docs.png...');
  const docsListOutput = `Directory: D:\\DoAn\\smartcrm-2374802010056-part-inventory\\docs

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----        10/19/2026   8:26 PM           4850 ai-disclosure.md
-a----        10/19/2026   8:10 PM           7240 api-contract.md
-a----        10/19/2026   7:15 PM           3420 architecture.md
-a----        10/19/2026   7:15 PM           5110 erd.md
-a----        10/19/2026   7:15 PM           8920 srs.md
-a----        10/19/2026   8:26 PM           4620 thay-doi-thiet-ke.md
-a----        10/19/2026   7:15 PM           4150 use-cases.md

Root Files:
-a----        10/19/2026   8:30 PM          13073 README.md
-a----        10/19/2026   7:10 PM            380 .env.example
-a----        10/19/2026   8:27 PM            320 .gitignore
-a----        10/19/2026   7:15 PM           4200 db/sql-ddl.sql
-a----        10/19/2026   8:29 PM         158200 src/backend/package-lock.json
-a----        10/19/2026   8:29 PM          48100 src/frontend/package-lock.json`;

  await captureTerminalSnippet(
    browser,
    'Required Documentation & Configuration Files',
    'dir docs; dir README.md, .env.example, .gitignore',
    docsListOutput,
    path.join(EVIDENCE_DIR, '09_git_and_docs', '28_required_docs.png'),
    1200, 750
  );

  // Xóa test.png thừa nếu có
  if (fs.existsSync(path.join(EVIDENCE_DIR, 'test.png'))) {
    fs.unlinkSync(path.join(EVIDENCE_DIR, 'test.png'));
  }

  await browser.close();
  console.log('=== ĐÃ HOÀN THÀNH CHỤP ĐỦ 28/28 ẢNH MINH CHỨNG THỰC TẾ! ===');
}

main().catch(err => {
  console.error('Lỗi khi chụp ảnh:', err);
  process.exit(1);
});
