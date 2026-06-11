import { validatePostMessageBody } from "@server/core/validators/post-message";
import { validator } from "hono/validator";
import { createFactory } from "hono/factory";
import type { createPostMessageHandlers } from "@server/core/handlers/post-message";

export const createPostMessagePresenter = (
    handlers: ReturnType<typeof createPostMessageHandlers>,
) => {
    const factory = createFactory();

    const postMessage = factory.createHandlers(
        validator("json", validatePostMessageBody),
        async (c) => {
            const { channelId } = c.req.valid("json");
            const messageId = await handlers.postMessageHandler(channelId);
            return c.json({ messageId });
        },
    );

    return { postMessage };
};
