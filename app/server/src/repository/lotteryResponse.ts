import { prisma } from "../external/db";
import type { LotteryResponse, Prisma } from "../generated/prisma/client";

export const lotteryResponseRepository = {
    async findMany(options: {
        orderBy?: { createdAt: "asc" | "desc" };
        take?: number;
    } = {}): Promise<Pick<LotteryResponse, "id" | "createdAt" | "channelId" | "month">[]> {
        return prisma.lotteryResponse.findMany({
            orderBy: options.orderBy,
            take: options.take,
            select: { id: true, createdAt: true, channelId: true, month: true },
        });
    },
    async findById(id: string): Promise<LotteryResponse | null> {
        return prisma.lotteryResponse.findUnique({
            where: { id },
        });
    },
    async create(data: {
        channelId: string;
        month: string;
        result: Prisma.InputJsonValue;
    }): Promise<LotteryResponse> {
        return prisma.lotteryResponse.create({
            data,
        });
    },
};
