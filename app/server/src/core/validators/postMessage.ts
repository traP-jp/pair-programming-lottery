import { adaptor } from "@server/core/validators/common/adaptor";
import { requireString } from "@server/core/validators/common/utility";

export const validatePostMessageBody = adaptor("json")(value => {
    const channelId = requireString(value, "channelId");
    return { channelId };
});
