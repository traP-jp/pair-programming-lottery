import type { ILotteryResponseRepository, IScheduleRepository } from "@server/core/repository";
import { formatResult } from "@server/core/services/lottery/format";
import { runLottery } from "@server/core/services/lottery/matching";
import type { UserPrefs } from "@server/types";
import { getCurrentYearMonthJst, getJstDay, isThisMonthJst } from "@server/utilities/time";

interface ISchedulerTraqService {
    collectUserPrefs(messageId: string): Promise<UserPrefs[]>;
    getuserNameMap(): Promise<Map<string, string>>;
    postLotteryMessage(channelId: string): Promise<string>;
    postMessage(channelId: string, content: string): Promise<void>;
}

async function _runScheduledLottery(
    scheduleRepo: IScheduleRepository,
    lotteryResponseRepo: ILotteryResponseRepository,
    traq: ISchedulerTraqService,
    channelId: string,
    messageId: string,
    yearMonth: string
) {
    const users = await traq.collectUserPrefs(messageId);

    if (users.length < 2) {
        console.warn(`[Scheduler] Not enough participants: ${users.length}`);
        return null;
    }

    const userNameMap = await traq.getuserNameMap();
    const lotteryResult = runLottery(users);
    const response = formatResult(lotteryResult, userNameMap);

    const saved = await lotteryResponseRepo.create({
        channelId,
        month: yearMonth,
        result: response,
    });

    await scheduleRepo.update({
        lastLotteryAt: new Date(),
    });

    const publicUrl = process.env["PUBLIC_URL"] ?? "http://localhost:5173";
    const resultUrl = `${publicUrl}/${saved.id}`;
    const pairs = response.pairs.length;
    const participants = response.participantCount;
    await traq.postMessage(
        channelId,
        `抽選結果\n${participants}人が参加し、${pairs}ペアを組みました。\n結果はこちら: ${resultUrl}`
    );
    console.log(`[Scheduler] Lottery done, result URL: ${resultUrl}`);
    return saved;
}

export async function _tick(
    scheduleRepo: IScheduleRepository,
    lotteryResponseRepo: ILotteryResponseRepository,
    traq: ISchedulerTraqService
) {
    const schedule = await scheduleRepo.get();
    if (!schedule || !schedule.enabled) return;

    const now = new Date();
    const day = getJstDay(now);
    const yearMonth = getCurrentYearMonthJst(now);

    if (day === schedule.postDay && !isThisMonthJst(schedule.lastPostedAt, yearMonth)) {
        console.log(`[Scheduler] postDay hit — posting to channel ${schedule.channelId}`);
        try {
            const messageId = await traq.postLotteryMessage(schedule.channelId);
            await scheduleRepo.update({
                lastMessageId: messageId,
                lastPostedAt: new Date(),
            });
            console.log(`[Scheduler] Posted message ${messageId}`);
        } catch (error) {
            console.error("[Scheduler] Failed to post message:", error);
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
            `[Scheduler] lotteryDay hit — running lottery for message ${schedule.lastMessageId}`
        );
        try {
            await _runScheduledLottery(
                scheduleRepo,
                lotteryResponseRepo,
                traq,
                schedule.channelId,
                schedule.lastMessageId,
                yearMonth
            );
        } catch (error) {
            console.error("[Scheduler] Failed to run lottery:", error);
        }
    }
}

export function createSchedulerService(
    scheduleRepo: IScheduleRepository,
    lotteryResponseRepo: ILotteryResponseRepository,
    traq: ISchedulerTraqService
) {
    return {
        async runScheduledLottery(channelId: string, messageId: string, yearMonth: string) {
            return _runScheduledLottery(
                scheduleRepo,
                lotteryResponseRepo,
                traq,
                channelId,
                messageId,
                yearMonth
            );
        },

        startScheduler() {
            console.log("[Scheduler] Started — checking every minute");

            async function runTicker() {
                try {
                    await _tick(scheduleRepo, lotteryResponseRepo, traq);
                } catch (error) {
                    console.error("[Scheduler] tick error:", error);
                } finally {
                    setTimeout(runTicker, 60_000);
                }
            }

            runTicker();
        },
    };
}
