import { ValidationErrorMessages } from "../../error/messages";
import type { LotteryResponse } from "../services/lottery/format";
import { adaptor } from "./common/adaptor";
import { requireString } from "./common/utility";

export const validateGetResultParams = adaptor("param")((params) => {
    const id = requireString(params, "id");
    return { id };
});

export const validateSaveResultBody = adaptor("json")((value) => {
    const messageId = requireString(value, "messageId");
    const result = value.result;

    if (!result || typeof result !== "object") {
        throw ValidationErrorMessages.PROPERTY_MUST_BE_OBJECT("result");
    }

    return {
        messageId,
        result: result as LotteryResponse,
    };
});
