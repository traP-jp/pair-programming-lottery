# Stage 1: build
FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lock bunfig.toml ./
COPY client/package.json client/bunfig.toml ./client/
COPY server/package.json server/bunfig.toml ./server/

RUN bun install --frozen-lockfile

COPY tsconfig.json ./
COPY client/ ./client
COPY server/ ./server

RUN DATABASE_URL="dummy" bun run --filter server --bun db:generate

WORKDIR /app/client
RUN bun run --bun build

# Stage 2: runner
FROM oven/bun:1 AS runner
WORKDIR /app
COPY --from=build /app/client/dist ./dist
EXPOSE 4173
ENTRYPOINT ["bun", "run", "dist/server/server.js"]
