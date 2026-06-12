const ENV_TRAQ_ACCESS_TOKEN = process.env["TRAQ_ACCESS_TOKEN"];

if (!ENV_TRAQ_ACCESS_TOKEN) {
    throw new Error("environment variable TRAQ_ACCESS_TOKEN is required");
}

const ENV_ADMINS = (process.env["ADMINS"] ?? "").split(",");
if (!ENV_ADMINS) {
    throw new Error("environment variable ADMINS is required.");
}

export const TRAQ_ACCESS_TOKEN = ENV_TRAQ_ACCESS_TOKEN;
export const ADMINS = ENV_ADMINS;
