import { createFactory } from "hono/factory";
import { validator } from "hono/validator";
import { validateRunLotteryBody } from "@server/core/validators/lottery";
import type { LotteryResult } from "@server/core/services/lottery/format";

export interface ILotteryHandlers {
    runLotteryHandler(messageId: string): Promise<LotteryResult>;
}

export const createLotteryPresenter = (handlers: ILotteryHandlers) => {
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
