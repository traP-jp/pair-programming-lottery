#! /bin/bash

bunx --bun prisma migrate deploy
bun run src/index.ts
