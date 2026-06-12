import { createFactory } from "hono/factory";
import {
    validateGetResultParams,
    validateSaveResultBody,
} from "@server/core/validators/results";
import { validator } from "hono/validator";
import { ApiErrorMessages } from "@server/error/messages";
import type { LotteryResponse } from "@server/core/repository/lotteryResponse";
import type { LotteryResult } from "@server/core/services/lottery/format";

export interface IResultsHandlers {
    getResultsHandler(): Promise<
        Pick<LotteryResponse, "id" | "createdAt" | "channelId" | "month">[]
    >;
    getResultHandler(id: string): Promise<LotteryResponse | null>;
    saveResultHandler(
        messageId: string,
        result: LotteryResult,
    ): Promise<LotteryResponse>;
}

export const createResultsPresenter = (handlers: IResultsHandlers) => {
    const factory = createFactory();

    const getResults = factory.createHandlers(async (c) => {
        return c.json(await handlers.getResultsHandler());
    });

    const getResult = factory.createHandlers(
        validator("param", validateGetResultParams),
        async (c) => {
            const params = c.req.valid("param");
            const results = await handlers.getResultHandler(params.id);
            if (!results) {
                throw ApiErrorMessages.LOTTERY_RESULT_NOT_FOUND(
                    params.id,
                ).asHttpException(404);
            }
            return c.json(results);
        },
    );

    const saveResult = factory.createHandlers(
        validator("json", validateSaveResultBody),
        async (c) => {
            const body = c.req.valid("json");
            return c.json(
                await handlers.saveResultHandler(body.messageId, body.result),
            );
        },
    );

    return { getResults, getResult, saveResult };
};
