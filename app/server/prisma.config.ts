import "dotenv-expand/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",
    datasource: {
        url:
            env("DATABASE_URL") ||
            `mysql://${env("NS_MARIADB_USER")}:${env("NS_MARIADB_PASSWORD")}@${env("NS_MARIADB_HOSTNAME")}:${env("NS_MARIADB_PORT")}/${env("NS_MARIADB_DATABASE")}`,
    },
});
