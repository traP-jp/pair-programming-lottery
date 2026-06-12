import { getEnv } from "@server/utilities/env";

export const TRAQ_ACCESS_TOKEN = getEnv("TRAQ_ACCESS_TOKEN");
export const ADMINS = (process.env["ADMINS"] ?? "").split(",");
