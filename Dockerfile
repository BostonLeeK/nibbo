FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

FROM base AS builder
WORKDIR /app

ARG AUTH_SECRET
ENV AUTH_SECRET=${AUTH_SECRET}
ENV NEXTAUTH_SECRET=${AUTH_SECRET}

ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run db:generate
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PGDATA=/var/lib/postgresql/data

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN apk add --no-cache su-exec tini libc6-compat openssl postgresql postgresql-client \
  && mkdir -p /var/lib/postgresql/data \
  && chown -R postgres:postgres /var/lib/postgresql/data

RUN mkdir -p public/uploads/recipes && chown -R nextjs:nodejs public

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
RUN mkdir -p public/uploads/recipes && chown -R nextjs:nodejs public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

USER root
ENTRYPOINT ["/sbin/tini", "--", "./docker-entrypoint.sh"]
