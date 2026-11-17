# ==========================================
# Stage 1: Build Frontend and Backend
# ==========================================
FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build both Vite SPA (/dist) and Express server (/dist-server)
RUN npm run build

# ==========================================
# Stage 2: Production Runner
# ==========================================
FROM node:22-slim AS runner

# Install espeak-ng for Hindi Text-to-Speech
RUN apt-get update && \
    apt-get install -y --no-install-recommends espeak-ng && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000

# Copy node_modules and compiled bundles directly from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server

EXPOSE 10000

# Start compiled server
CMD ["node", "dist-server/server.js"]
