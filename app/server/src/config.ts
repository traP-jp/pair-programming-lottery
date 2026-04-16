const ENV_TRAQ_ACCESS_TOKEN = process.env["TRAQ_ACCESS_TOKEN"];

if (!ENV_TRAQ_ACCESS_TOKEN) {
    console.error("Error: environment variable TRAQ_ACCESS_TOKEN is required");
    process.exit(1);
}

const ENV_ADMINS = (process.env["ADMINS"] ?? "").split(",");
if (!ENV_ADMINS) {
    console.error("Error: environment variable ADMIN_TOKEN is required.");
    process.exit(1);
}

export const TRAQ_ACCESS_TOKEN = ENV_TRAQ_ACCESS_TOKEN;
export const ADMINS = ENV_ADMINS;
