# Backend Dockerfile for Railway deployment
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy workspace package.json files
COPY packages/shared/package*.json ./packages/shared/
COPY packages/backend/package*.json ./packages/backend/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend

# Build shared and backend
RUN npm run build --workspace=@character-creator/shared
RUN npm run build --workspace=@character-creator/backend

# Production image
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/backend/package*.json ./packages/backend/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built files
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist

# Create logs directory
RUN mkdir -p /app/logs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["node", "packages/backend/dist/server.js"]
