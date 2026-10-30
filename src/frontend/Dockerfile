# ==============================================================================
# SMART CRM — DOCKERFILE CHO FRONTEND (REACT 19 + VITE + NGINX)
# Kiến trúc: Multi-stage Build (Stage 1: Vite Build -> Stage 2: Nginx Alpine)
# ==============================================================================

# ------------------------------------------------------------------------------
# Giai đoạn 1: Biên dịch mã nguồn React (Builder)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Sao chép manifest và lockfile trước để tận dụng layer caching
COPY package*.json ./

# Cài đặt toàn bộ dependencies (bao gồm devDependencies cho Vite)
RUN npm ci

# Sao chép mã nguồn frontend
COPY index.html ./
COPY vite.config.js ./
COPY public/ ./public/
COPY src/ ./src/

# Biên dịch ra bundle tĩnh trong thư mục dist/
RUN npm run build

# ------------------------------------------------------------------------------
# Giai đoạn 2: Phục vụ ứng dụng tĩnh qua Web Server Nginx (Runner)
# ------------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runner

# Sao chép file cấu hình reverse proxy & SPA fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Sao chép bundle tĩnh từ stage builder vào web root của Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Mở cổng HTTP 80
EXPOSE 80

# Healthcheck dịch vụ frontend
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Khởi động Nginx ở chế độ foreground
CMD ["nginx", "-g", "daemon off;"]
