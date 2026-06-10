import { prisma } from "../../external/db";
import {
    buildStampMap,
    collectUserPrefs,
    buildUserNameMap,
    buildBotUserIds,
    postLotteryMessage,
} from "../../external/traq";
import { getCurrentYearMonthJst } from "./time";
import { runLottery } from "./lottery/matching";
import { formatResult } from "./lottery/format";
import type { createApiClient } from "../../external/traq";

type TraqClient = ReturnType<typeof createApiClient>;

function todayJst(): { day: number; yearMonth: string } {
    const now = new Date();
    const day = new Date(now.getTime() + 9 * 60 * 60 * 1000).getUTCDate();
    const yearMonth = getCurrentYearMonthJst(now);
    return { day, yearMonth };
}

function isThisMonth(isoDateTime: Date | null, yearMonth: string): boolean {
    if (!isoDateTime) return false;
    const d = new Date(isoDateTime.getTime() + 9 * 60 * 60 * 1000);
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    return ym === yearMonth;
}

async function tick(traq: TraqClient) {
    const schedule = await prisma.schedule.findUnique({ where: { id: 1 } });
    if (!schedule || !schedule.enabled) return;

    const { day, yearMonth } = todayJst();

    if (
        day === schedule.postDay &&
        !isThisMonth(schedule.lastPostedAt, yearMonth)
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
            await prisma.schedule.update({
                where: { id: 1 },
                data: {
                    lastMessageId: messageId,
                    lastPostedAt: new Date(),
                },
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
        isThisMonth(schedule.lastPostedAt, yearMonth) &&
        !isThisMonth(schedule.lastLotteryAt, yearMonth)
    ) {
        console.log(
            `[Scheduler] lotteryDay hit — running lottery for message ${schedule.lastMessageId}`,
        );
        try {
            await runScheduledLottery(
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

    const saved = await prisma.lotteryResponse.create({
        data: {
            channelId,
            month: yearMonth,
            result: response as any,
        },
    });

    await prisma.schedule.update({
        where: { id: 1 },
        data: { lastLotteryAt: new Date() },
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

export function startScheduler(traq: TraqClient) {
    console.log("[Scheduler] Started — checking every minute");
    setInterval(() => {
        tick(traq).catch((e) => console.error("[Scheduler] tick error:", e));
    }, 60_000);

    tick(traq).catch((e) =>
        console.error("[Scheduler] initial tick error:", e),
    );
}
