# Multi-stage build for Character Creator
# Stage 1: Install all dependencies (npm workspaces require all package.json files)
FROM node:20-alpine AS base-builder
WORKDIR /app

# Copy root package files including lock file
COPY package*.json ./

# Copy all workspace package.json files (required for npm workspaces)
COPY packages/shared/package*.json ./packages/shared/
COPY packages/backend/package*.json ./packages/backend/
COPY packages/frontend/package*.json ./packages/frontend/

# Install ALL dependencies at once (npm workspaces need this)
RUN npm ci

# Stage 2: Build shared package
FROM base-builder AS shared-builder
COPY packages/shared ./packages/shared
RUN npm run build --workspace=@character-creator/shared

# Stage 3: Build backend
FROM shared-builder AS backend-builder
COPY packages/backend ./packages/backend
RUN npm run build --workspace=@character-creator/backend

# Stage 4: Build frontend
FROM shared-builder AS frontend-builder
COPY packages/frontend ./packages/frontend
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build --workspace=@character-creator/frontend

# Stage 5: Production backend image
FROM node:20-alpine AS backend
WORKDIR /app
ENV NODE_ENV=production

# Copy root package files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/backend/package*.json ./packages/backend/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built files
COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=shared-builder /app/packages/shared/package.json ./packages/shared/
COPY --from=backend-builder /app/packages/backend/dist ./packages/backend/dist

# Create logs directory
RUN mkdir -p /app/logs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

EXPOSE 5000
CMD ["node", "packages/backend/dist/server.js"]

# Stage 6: Production frontend (nginx)
FROM nginx:alpine AS frontend
COPY --from=frontend-builder /app/packages/frontend/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
