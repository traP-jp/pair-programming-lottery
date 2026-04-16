import { adaptor } from "./common/adaptor";
import { requireString } from "./common/utility";

export const validateRunLotteryBody = adaptor("json")((value) => {
    const messageId = requireString(value, "messageId");
    return { messageId };
});
