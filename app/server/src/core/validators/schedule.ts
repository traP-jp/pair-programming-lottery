import { ApiErrorMessages } from "../../error/messages";
import { adaptor } from "./common/adaptor";
import {
    assert,
    requireBoolean,
    requireNumber,
    requireString,
} from "./common/utility";

export const validatePostScheduleBody = adaptor("json")((value) => {
    const channelId = requireString(value, "channelId");
    const postDay = requireNumber(value, "postDay");
    const lotteryDay = requireNumber(value, "lotteryDay");
    const enabled = requireBoolean(value, "enabled");

    assert(
        postDay < 1 || postDay > 28,
        ApiErrorMessages.POST_DAY_OUT_OF_RANGE(postDay),
    );

    assert(
        lotteryDay < 1 || lotteryDay > 28,
        ApiErrorMessages.RUNNING_DAY_OUT_OF_RANGE(lotteryDay),
    );

    assert(
        postDay >= lotteryDay,
        ApiErrorMessages.POST_DAY_MUST_BE_BEFORE_RUNNING(postDay, lotteryDay),
    );

    return {
        channelId,
        postDay,
        lotteryDay,
        enabled: enabled !== false,
    };
});
