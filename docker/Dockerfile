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

# Set working directory
WORKDIR /app

# Copy from builder
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy scripts
COPY --from=builder /app/scripts ./scripts
RUN chmod +x ./scripts/start.sh

# Create db directory
RUN mkdir -p /app/db

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Expose port
EXPOSE 3000

# Set proper entrypoint
ENTRYPOINT ["./scripts/start.sh"]
