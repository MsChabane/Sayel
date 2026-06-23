# ── Stage 1: Dependencies ──────────────────────────────────────────────────────
FROM node:18-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files only — layer cached unless deps change
COPY package.json package-lock.json* ./
RUN npm ci --only=production=false


# ── Stage 2: Builder ───────────────────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build arguments — passed at build time from CI/CD
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

RUN npm run build


# ── Stage 3: Runtime ───────────────────────────────────────────────────────────
FROM node:18-alpine AS runtime

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache curl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

WORKDIR /app

# Copy only what Next.js needs to run
# standalone output includes the minimal server
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000 \
    HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# standalone output generates server.js at the root
CMD ["node", "server.js"]