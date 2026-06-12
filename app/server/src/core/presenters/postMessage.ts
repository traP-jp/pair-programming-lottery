import { validatePostMessageBody } from "@server/core/validators/postMessage";
import { createFactory } from "hono/factory";
import { validator } from "hono/validator";

export interface IPostMessageHandlers {
    postMessageHandler(channelId: string): Promise<string>;
}

export const createPostMessagePresenter = (handlers: IPostMessageHandlers) => {
    const factory = createFactory();

    const postMessage = factory.createHandlers(
        validator("json", validatePostMessageBody),
        async c => {
            const { channelId } = c.req.valid("json");
            const messageId = await handlers.postMessageHandler(channelId);
            return c.json({ messageId });
        }
    );

    return { postMessage };
};
