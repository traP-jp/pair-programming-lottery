import { adaptor } from "./common/adaptor";
import { requireString } from "./common/utility";

export const validatePostMessageBody = adaptor("json")((value) => {
    const channelId = requireString(value, "channelId");
    return { channelId };
});
