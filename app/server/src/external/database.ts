import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@server/generated/prisma/client";

const adapter = new PrismaMariaDb({
    database: process.env.NS_MARIADB_DATABASE,
    password: process.env.NS_MARIADB_PASSWORD,
    host: process.env.NS_MARIADB_HOSTNAME,
    port: Number(process.env.NS_MARIADB_PORT),
    user: process.env.NS_MARIADB_USER,
    connectionLimit: 5,
});

export const prisma = new PrismaClient({
    adapter,
    log: process.env["NODE_ENV"] === "development" ? ["query", "error", "warn"] : ["error"],
});
