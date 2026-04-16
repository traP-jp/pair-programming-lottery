FROM oven/bun:1
WORKDIR /app

ARG BUILD_ENV=production

COPY package.json bun.lock ./
COPY server/package.json server/
COPY client/package.json client/

RUN bun install --frozen-lockfile

COPY server/src/ server/src/
COPY server/prisma/ server/prisma/

RUN bunx --bun prisma generate --schema=server/prisma/schema.prisma

COPY server/ server/

EXPOSE 3000
ENV PORT=3000

WORKDIR /app/server

ENTRYPOINT [ "./scripts/start.sh" ]
