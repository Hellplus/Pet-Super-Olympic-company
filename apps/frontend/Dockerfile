# ============ Stage 1: Build ============
FROM node:20-alpine AS builder

# Use China npm mirror
RUN npm config set registry https://registry.npmmirror.com && \
    npm install -g pnpm@9 && \
    pnpm config set registry https://registry.npmmirror.com

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# Copy shared package
COPY packages/shared/package.json packages/shared/
COPY packages/shared/src packages/shared/src/
COPY packages/shared/tsconfig.json packages/shared/

# Copy frontend package
COPY apps/frontend/package.json apps/frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy frontend source
COPY apps/frontend/ apps/frontend/

# Build shared first
RUN cd packages/shared && pnpm run build 2>/dev/null || true

# Build frontend for production
RUN cd apps/frontend && pnpm run build

# ============ Stage 2: Serve with Nginx ============
FROM nginx:1.25-alpine AS production

# Copy built static files
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copy nginx config
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
