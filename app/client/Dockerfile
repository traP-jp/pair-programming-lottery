FROM oven/bun:1 AS build
WORKDIR /app

ARG BUILD_ENV=production

COPY package.json bun.lock ./
COPY client/package.json ./client/
COPY server/package.json ./server/

RUN bun install --frozen-lockfile

COPY tsconfig.json ./
COPY client/ ./client
COPY server/ ./server

ENV DATABASE_URL="dummy"
RUN bun run --filter server --bun db:generate

WORKDIR /app/client
RUN \
    if [ "${BUILD_ENV}" = "production" ]; then \
        bun run --bun build; \
    fi

FROM scratch
COPY --from=build /app/client/dist /dist
