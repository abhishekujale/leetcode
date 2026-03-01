# ── Base image with Node.js + language runtimes for code execution ──────────
FROM node:22-alpine

# Language runtimes needed by the execution-service
RUN apk add --no-cache \
    python3 \
    py3-pip \
    g++ \
    make \
    openjdk17 \
    go

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Default port (overridden per-service in docker-compose)
EXPOSE 8787 3001 3002 3003 3004 3005 3006
