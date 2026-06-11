import { applyBuilder, buildApiErrorMessage } from "@server/error/builders";

export default applyBuilder(buildApiErrorMessage, {
    LOTTERY_RESULT_NOT_FOUND: (id: string) =>
        `lottery result for "${id}" not found.`,
    TARGET_USERS_MUST_BE_MULTIPLE: (id: string, count: number) =>
        `targeted users for "${id}" must be multiple: given ${count}.`,
    POST_DAY_OUT_OF_RANGE: (date: number) => `post day must be 1-28: ${date}`,
    RUNNING_DAY_OUT_OF_RANGE: (date: number) =>
        `lottery day must be 1-28: ${date}`,
    POST_DAY_MUST_BE_BEFORE_RUNNING: (postDay: number, lotteryDay: number) =>
        `postDay (${postDay}) must be less than lotteryDay (${lotteryDay})`,
    SCHEDULE_NOT_FOUND: `schedule not found.`,
    NO_MESSAGE_POSTED: `no message posted yet for this month.`,
    NO_ENOUGH_PARTICIPANTS: `not enough participants`,
} as const);
