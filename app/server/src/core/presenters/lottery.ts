import { createFactory } from "hono/factory";
import { validator } from "hono/validator";
import { validateRunLotteryBody } from "@server/core/validators/lottery";
import type { createLotteryHandlers } from "@server/core/handlers/lottery";

export const createLotteryPresenter = (
    handlers: ReturnType<typeof createLotteryHandlers>
) => {
    const factory = createFactory();

    const runLottery = factory.createHandlers(
        validator("json", validateRunLotteryBody),
        async (c) => {
            const { messageId } = c.req.valid("json");
            return c.json(await handlers.runLotteryHandler(messageId));
        },
    );

    return { runLottery };
};
