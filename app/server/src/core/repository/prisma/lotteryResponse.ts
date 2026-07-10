import type {
    ILotteryResponseRepository,
    LotteryResponse,
} from "@server/core/repository/lotteryResponse";
import type { LotteryResult as LotteryResponseType } from "@server/core/services/lottery/format";
import { prisma } from "@server/external/database";
import type { Prisma } from "@server/generated/prisma/client";

export class PrismaLotteryResponseRepository implements ILotteryResponseRepository {
    constructor() {}

    async findMany(
        options: {
            orderBy?: { createdAt: "asc" | "desc" };
            take?: number;
        } = {}
    ): Promise<Pick<LotteryResponse, "id" | "createdAt" | "channelId" | "month">[]> {
        return prisma.lotteryResponse.findMany({
            orderBy: options.orderBy,
            take: options.take,
            select: { id: true, createdAt: true, channelId: true, month: true },
        });
    }

    async findById(id: string): Promise<LotteryResponse | null> {
        const record = await prisma.lotteryResponse.findUnique({
            where: { id },
        });
        if (!record) return null;
        return {
            ...record,
            result: record.result as unknown as LotteryResponseType,
        };
    }

    async findRecentResultsWithDetail(limit: number): Promise<LotteryResponse[]> {
        const records = await prisma.lotteryResponse.findMany({
            orderBy: { createdAt: "desc" },
            take: limit,
        });
        return records.map(record => ({
            ...record,
            result: record.result as unknown as LotteryResponseType,
        }));
    }

    async create(data: {
        channelId: string;
        month: string;
        result: object;
    }): Promise<LotteryResponse> {
        const saved = await prisma.lotteryResponse.create({
            data: {
                ...data,
                result: data.result as Prisma.InputJsonValue,
            },
        });
        return {
            ...saved,
            result: data.result as unknown as LotteryResponseType,
        };
    }
}
