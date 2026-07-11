# syntax=docker/dockerfile:1

# Stage 1: build-env
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock bunfig.toml ./
COPY server/package.json server/bunfig.toml ./server/
COPY client/package.json client/bunfig.toml ./client/

RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

COPY tsconfig.json ./
COPY server/src/ ./server/src
COPY server/prisma/ ./server/prisma

RUN DATABASE_URL="dummy" bun run --filter server --bun db:generate
RUN bun run --filter server build

# Stage 2: prod-deps
FROM oven/bun:1 AS prod-deps
WORKDIR /app

COPY package.json bun.lock bunfig.toml ./
COPY server/package.json server/bunfig.toml ./server/
COPY client/package.json client/bunfig.toml ./client/

RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production --omit=peer --omit=optional

# Stage 3: runner
FROM oven/bun:1-distroless AS runner
WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/server/node_modules ./server/node_modules

COPY package.json ./
COPY server/package.json ./server/

COPY --from=builder /app/server/src/generated /app/server/src/generated
COPY --from=builder /app/server/dist /app/server/dist
COPY server/prisma /app/server/prisma
COPY server/prisma.config.ts /app/server/

EXPOSE 3000
ENV PORT=3000

WORKDIR /app/server

USER nonroot
ENTRYPOINT [ "bun" ]
CMD [ "run", "dist/index.js" ]
