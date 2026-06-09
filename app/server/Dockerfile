FROM oven/bun:1
WORKDIR /app

ARG BUILD_ENV=production

COPY package.json bun.lock ./
COPY server/package.json ./server/
COPY client/package.json ./client/

RUN bun install --frozen-lockfile

COPY server/src/ ./server/src
COPY server/prisma/ ./server/prisma

ENV DATABASE_URL="dummy"
RUN bun run --filter server --bun db:generate
ENV DATABASE_URL=""

COPY server/scripts ./server/scripts
RUN chmod +x ./server/scripts/start.sh

EXPOSE 3000
ENV PORT=3000

WORKDIR /app/server/
COPY server/prisma.config.ts ./

ENTRYPOINT [ "bash" ]
CMD [ "-c", "./scripts/start.sh" ]
