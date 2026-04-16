import { validatePostMessageBody } from "../validators/post-message";
import { validator } from "hono/validator";
import { createFactory } from "hono/factory";
import { postMessageHandler } from "../handlers/post-message";

const factory = createFactory();

export const postMessage = factory.createHandlers(
    validator("json", validatePostMessageBody),
    async (c) => {
        const { channelId } = c.req.valid("json");
        const messageId = await postMessageHandler(channelId);
        return c.json({ messageId });
    },
);
