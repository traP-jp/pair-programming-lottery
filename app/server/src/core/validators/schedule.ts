import { adaptor } from "@server/core/validators/common/adaptor";
import {
    assert,
    requireBoolean,
    requireNumber,
    requireString,
} from "@server/core/validators/common/utility";
import { ApiErrorMessages } from "@server/error/messages";

export const validatePostScheduleBody = adaptor("json")(value => {
    const channelId = requireString(value, "channelId");
    const postDay = requireNumber(value, "postDay");
    const lotteryDay = requireNumber(value, "lotteryDay");
    const enabled = requireBoolean(value, "enabled");

    assert(1 < postDay && postDay < 28, ApiErrorMessages.POST_DAY_OUT_OF_RANGE(postDay));

    assert(
        1 < lotteryDay && lotteryDay < 28,
        ApiErrorMessages.RUNNING_DAY_OUT_OF_RANGE(lotteryDay)
    );

    assert(
        postDay < lotteryDay,
        ApiErrorMessages.POST_DAY_MUST_BE_BEFORE_RUNNING(postDay, lotteryDay)
    );

    return {
        channelId,
        postDay,
        lotteryDay,
        enabled: enabled !== false,
    };
});
