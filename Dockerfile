# Multi-stage build for Character Creator
# Stage 1: Build shared package
FROM node:20-alpine AS shared-builder
WORKDIR /app
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci --workspace=@character-creator/shared
COPY packages/shared ./packages/shared
RUN npm run build --workspace=@character-creator/shared

# Stage 2: Build backend
FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY --from=shared-builder /app/packages/shared ./packages/shared
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
RUN npm ci --workspace=@character-creator/backend
COPY packages/backend ./packages/backend
RUN npm run build --workspace=@character-creator/backend

# Stage 3: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY --from=shared-builder /app/packages/shared ./packages/shared
COPY package*.json ./
COPY packages/frontend/package*.json ./packages/frontend/
RUN npm ci --workspace=@character-creator/frontend
COPY packages/frontend ./packages/frontend
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build --workspace=@character-creator/frontend

# Stage 4: Production backend image
FROM node:20-alpine AS backend
WORKDIR /app
ENV NODE_ENV=production

# Install production dependencies only
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/backend/package*.json ./packages/backend/
RUN npm ci --workspace=@character-creator/backend --omit=dev

# Copy built files
COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=backend-builder /app/packages/backend/dist ./packages/backend/dist

# Create logs directory
RUN mkdir -p /app/logs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

EXPOSE 5000
CMD ["node", "packages/backend/dist/server.js"]

# Stage 5: Production frontend (nginx)
FROM nginx:alpine AS frontend
COPY --from=frontend-builder /app/packages/frontend/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
