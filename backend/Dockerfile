# ─────────────── Build stage ───────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl openssl-dev

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY src ./src/
COPY tsconfig.json ./

RUN npm install
RUN npx prisma generate
RUN npm run build

# Compile seed separately
RUN npx tsc src/seed.ts --outDir dist/seeds --esModuleInterop --skipLibCheck --noEmitOnError false 2>/dev/null || true

# ─────────────── Production stage ───────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 5000

# Wait for DB, push schema, run seed, then start
CMD ["sh", "-c", "until npx prisma db push 2>&1; do echo 'Waiting for DB...'; sleep 3; done && node dist/seed.js 2>/dev/null || true && node dist/index.js"]
