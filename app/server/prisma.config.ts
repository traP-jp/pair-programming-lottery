import "dotenv-expand/config";
import { defineConfig, env } from "prisma/config";

const DATABASE_URL =
    process.env.DATABASE_URL ||
    `mysql://${env("NS_MARIADB_USER")}:${env("NS_MARIADB_PASSWORD")}@${env("NS_MARIADB_HOSTNAME")}:${env("NS_MARIADB_PORT")}/${env("NS_MARIADB_DATABASE")}`;

export default defineConfig({
    schema: "prisma/schema.prisma",
    datasource: {
        url: DATABASE_URL,
    },
});
