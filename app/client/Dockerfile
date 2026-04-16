FROM oven/bun:1 as build
WORKDIR /app

ARG BUILD_ENV=production

COPY package.json bun.lock ./
COPY server/package.json server/
COPY client/package.json client/

RUN bun install --frozen-lockfile

COPY client/ ./client
COPY server/ ./server
COPY tsconfig.json ./

RUN bunx --bun prisma generate --schema=server/prisma/schema.prisma

WORKDIR /app/client
RUN \
    if [ BUILD_ENV = "production" ]; then \
        bun run build; \
    fi

FROM scratch
COPY --from=build /app/dist /dist
