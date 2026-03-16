# ============ Stage 1: Build ============
FROM node:20-alpine AS builder

# Use China npm mirror
RUN npm config set registry https://registry.npmmirror.com && \
    npm install -g pnpm@9 typescript && \
    pnpm config set registry https://registry.npmmirror.com

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# Copy shared package
COPY packages/shared/package.json packages/shared/
COPY packages/shared/src packages/shared/src/
COPY packages/shared/tsconfig.json packages/shared/

# Copy backend package
COPY apps/backend/package.json apps/backend/
COPY apps/backend/tsconfig.json apps/backend/
COPY apps/backend/tsconfig.build.json apps/backend/
COPY apps/backend/nest-cli.json apps/backend/

# Install dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy backend source
COPY apps/backend/src apps/backend/src/

# Build shared first (compile TS to JS)
RUN cd packages/shared && npx tsc --outDir dist --declaration

# Build backend
RUN cd apps/backend && pnpm run build

# ============ Stage 2: Production ============
FROM node:20-alpine AS production

# Use China npm mirror
RUN npm config set registry https://registry.npmmirror.com && \
    npm install -g pnpm@9 && \
    pnpm config set registry https://registry.npmmirror.com

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy compiled shared package
COPY --from=builder /app/packages/shared/dist packages/shared/dist/

# Copy compiled backend
COPY --from=builder /app/apps/backend/dist apps/backend/dist/

# Create upload directory
RUN mkdir -p /app/uploads

EXPOSE 3000

WORKDIR /app/apps/backend

CMD ["node", "dist/apps/backend/src/main"]
