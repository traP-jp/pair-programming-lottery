import { adaptor } from "@server/core/validators/common/adaptor";
import { requireString } from "@server/core/validators/common/utility";

export const validateRunLotteryBody = adaptor("json")(value => {
    const messageId = requireString(value, "messageId");
    return { messageId };
});
