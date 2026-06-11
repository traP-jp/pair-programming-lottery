import type { LotteryResponse, Prisma } from "@server/generated/prisma/client";

export interface ILotteryResponseRepository {
    findMany(options?: {
        orderBy?: { createdAt: "asc" | "desc" };
        take?: number;
    }): Promise<
        Pick<LotteryResponse, "id" | "createdAt" | "channelId" | "month">[]
    >;
    findById(id: string): Promise<LotteryResponse | null>;
    create(data: {
        channelId: string;
        month: string;
        result: Prisma.InputJsonValue;
    }): Promise<LotteryResponse>;
}
