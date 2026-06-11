import type { HonoRequest } from "hono";
import { ADMINS } from "@server/config";
import { createMiddleware } from "hono/factory";

function isAdmin(request: HonoRequest): boolean {
    const userId = request.header("X-Forwarded-User") ?? "";
    return ADMINS.includes(userId);
}

export const adminOnlyMiddleware = createMiddleware(async (context, next) => {
    if (!isAdmin(context.req))
        return context.json({ error: "Unauthorized" }, 401);

    await next();
});
