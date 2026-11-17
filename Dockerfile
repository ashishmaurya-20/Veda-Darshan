# ==========================================
# Stage 1: Build Frontend and Backend
# ==========================================
FROM node:22-bullseye-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build both Vite SPA (/dist) and Express server (/dist-server)
RUN npm run build

# ==========================================
# Stage 2: Production Runner
# ==========================================
FROM node:22-bullseye-slim AS runner

# Install espeak-ng & Hindi phoneme data for Text-to-Speech
RUN apt-get update && \
    apt-get install -y --no-install-recommends espeak-ng espeak-ng-data && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled bundles from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server

EXPOSE 10000

# Start compiled server
CMD ["node", "dist-server/server.js"]
