import type {
    IScheduleRepository,
    ILotteryResponseRepository,
} from "@server/repository";
import {
    buildStampMap,
    collectUserPrefs,
    buildUserNameMap,
    buildBotUserIds,
    postLotteryMessage,
} from "@server/external/traq";
import {
    getJstDate,
    getCurrentYearMonthJst,
    isThisMonthJst,
} from "@server/core/services/time";
import { runLottery } from "@server/core/services/lottery/matching";
import { formatResult } from "@server/core/services/lottery/format";
import type { createApiClient } from "@server/external/traq";

type TraqClient = ReturnType<typeof createApiClient>;

async function tick(
    scheduleRepo: IScheduleRepository,
    lotteryResponseRepo: ILotteryResponseRepository,
    traq: TraqClient,
) {
    const schedule = await scheduleRepo.get();
    if (!schedule || !schedule.enabled) return;

    const now = new Date();
    const day = getJstDate(now).getUTCDate();
    const yearMonth = getCurrentYearMonthJst(now);

    if (
        day === schedule.postDay &&
        !isThisMonthJst(schedule.lastPostedAt, yearMonth)
    ) {
        console.log(
            `[Scheduler] postDay hit — posting to channel ${schedule.channelId}`,
        );
        try {
            const { stampNameToId } = await buildStampMap(traq);
            const messageId = await postLotteryMessage(
                traq,
                schedule.channelId,
                stampNameToId,
            );
            await scheduleRepo.update({
                lastMessageId: messageId,
                lastPostedAt: new Date(),
            });
            console.log(`[Scheduler] Posted message ${messageId}`);
        } catch (e) {
            console.error("[Scheduler] Failed to post message:", e);
        }
        return;
    }

    if (
        day === schedule.lotteryDay &&
        schedule.lastMessageId &&
        isThisMonthJst(schedule.lastPostedAt, yearMonth) &&
        !isThisMonthJst(schedule.lastLotteryAt, yearMonth)
    ) {
        console.log(
            `[Scheduler] lotteryDay hit — running lottery for message ${schedule.lastMessageId}`,
        );
        try {
            await runScheduledLottery(
                scheduleRepo,
                lotteryResponseRepo,
                traq,
                schedule.channelId,
                schedule.lastMessageId,
                yearMonth,
            );
        } catch (e) {
            console.error("[Scheduler] Failed to run lottery:", e);
        }
    }
}

export async function runScheduledLottery(
    scheduleRepo: IScheduleRepository,
    lotteryResponseRepo: ILotteryResponseRepository,
    traq: TraqClient,
    channelId: string,
    messageId: string,
    yearMonth: string,
) {
    const { stampIdToName } = await buildStampMap(traq);
    const botUserIds = await buildBotUserIds(traq);
    const users = await collectUserPrefs(
        traq,
        messageId,
        stampIdToName,
        botUserIds,
    );

    if (users.length < 2) {
        console.warn(`[Scheduler] Not enough participants: ${users.length}`);
        return null;
    }

    const userNameMap = await buildUserNameMap(traq);
    const LotteryResponse = runLottery(users);
    const response = formatResult(LotteryResponse, userNameMap);

    const saved = await lotteryResponseRepo.create({
        channelId,
        month: yearMonth,
        result: response as any,
    });

    await scheduleRepo.update({
        lastLotteryAt: new Date(),
    });

    const publicUrl = process.env["PUBLIC_URL"] ?? "http://localhost:5173";
    const resultUrl = `${publicUrl}/${saved.id}`;
    const pairs = response.pairs.length;
    const participants = response.participantCount;
    await traq.channels.postMessage(channelId, {
        content: `抽選結果\n${participants}人が参加し、${pairs}ペアを組みました。\n結果はこちら: ${resultUrl}`,
        embed: false,
    });
    console.log(`[Scheduler] Lottery done, result URL: ${resultUrl}`);
    return saved;
}

export function startScheduler(
    scheduleRepo: IScheduleRepository,
    lotteryResponseRepo: ILotteryResponseRepository,
    traq: TraqClient,
) {
    console.log("[Scheduler] Started — checking every minute");
    setInterval(() => {
        tick(scheduleRepo, lotteryResponseRepo, traq).catch((e) =>
            console.error("[Scheduler] tick error:", e),
        );
    }, 60_000);

    tick(scheduleRepo, lotteryResponseRepo, traq).catch((e) =>
        console.error("[Scheduler] initial tick error:", e),
    );
}
