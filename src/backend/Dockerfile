# ==============================================================================
# SMART CRM — DOCKERFILE CHO BACKEND (NODE.JS / EXPRESS)
# Kiến trúc: Node.js 20 Alpine, Non-root user, Healthcheck
# ==============================================================================

FROM node:20-alpine AS runner

WORKDIR /app

# Thiết lập biến môi trường chạy production
ENV NODE_ENV=production

# Cài đặt wget cho healthcheck
RUN apk add --no-cache wget

# Sao chép file mô tả phụ thuộc trước để tối ưu hóa Docker layer cache
COPY package*.json ./

# Cài đặt phụ thuộc production từ lockfile
RUN npm ci --omit=dev && npm cache clean --force

# Sao chép mã nguồn backend
COPY server.js ./
COPY src/ ./src/
COPY scripts/ ./scripts/

# Chạy với người dùng không đặc quyền (non-root) để đảm bảo an toàn bảo mật
USER node

# Mở cổng dịch vụ backend
EXPOSE 3000

# Kiểm tra trạng thái hoạt động của dịch vụ backend
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Lệnh khởi chạy chính
CMD ["node", "server.js"]
