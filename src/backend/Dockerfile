# ==============================================================================
# SMART CRM — DOCKERFILE CHO BACKEND (NODE.JS / EXPRESS)
# Build context = THƯ MỤC GỐC REPO (xem docker-compose.yml) để image chứa được
# sql/sql-ddl.sql và data/sample/*.csv phục vụ migrate + seed bên trong container.
# ==============================================================================

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    SQL_DDL_PATH=/app/sql/sql-ddl.sql \
    SAMPLE_DATA_DIR=/app/data/sample

# wget phục vụ healthcheck
RUN apk add --no-cache wget

# Cài phụ thuộc production từ lockfile (phiên bản được ghim trong package-lock.json)
COPY src/backend/package.json src/backend/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Mã nguồn backend, script khởi tạo CSDL và bộ test (để chạy được `npm test` trong container)
COPY src/backend/server.js ./
COPY src/backend/src/ ./src/
COPY src/backend/scripts/ ./scripts/
COPY src/backend/tests/ ./tests/

# DDL và dữ liệu mẫu (dữ liệu giả lập của case study, không chứa dữ liệu khách hàng thật)
COPY sql/sql-ddl.sql ./sql/sql-ddl.sql
COPY data/sample/ ./data/sample/

# Chạy bằng user không đặc quyền
USER node

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
