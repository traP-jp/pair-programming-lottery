import { createFactory } from "hono/factory";
import { validator } from "hono/validator";
import { validateRunLotteryBody } from "../validators/lottery";
import { runLotteryHandler } from "../handlers/lottery";

const factory = createFactory();

export const runLottery = factory.createHandlers(
    validator("json", validateRunLotteryBody),
    async (c) => {
        const { messageId } = c.req.valid("json");
        return c.json(await runLotteryHandler(messageId));
    },
);
