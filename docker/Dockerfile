# Multi-stage build for production
FROM oven/bun:1 AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Copy source code
COPY . .

# Generate Prisma Client
RUN bunx prisma generate

# Build Next.js application
RUN bun run build

# Production stage
FROM oven/bun:1 AS runner

# Install dumb-init for signal handling
RUN apt-get update && apt-get install -y dumb-init

# Create non-root user for security
RUN groupadd -r node && useradd -r -g node -m -d /app -s /bin/bash node

# Set working directory
WORKDIR /app

# Copy from builder
COPY --from=builder --chown=node:node /app/next.config.js ./
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

# Create db directory
RUN mkdir -p /app/db && chown node:node /app/db

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Expose port
EXPOSE 3000

# Switch to non-root user
USER node

# Set proper entrypoint
ENTRYPOINT ["dumb-init", "--", "bun", "run", "start"]
