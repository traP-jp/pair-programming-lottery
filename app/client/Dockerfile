FROM oven/bun:1 AS build
WORKDIR /app

ARG BUILD_ENV=production

COPY package.json bun.lock ./
COPY client/package.json ./client/
COPY server/package.json ./server/

RUN \
    if [ "${BUILD_ENV}" = "production" ]; then \
        bun install --frozen-lockfile --production; \
    fi

COPY tsconfig.json ./
COPY client/ ./client
COPY server/ ./server

RUN \
    if [ "${BUILD_ENV}" = "production" ]; then \
        DATABASE_URL="dummy" bun run --filter server --bun db:generate; \
    fi

WORKDIR /app/client
RUN \
    if [ "${BUILD_ENV}" = "production" ]; then \
        bun run --bun build; \
    fi

FROM scratch
COPY --from=build /app/client/dist /dist
