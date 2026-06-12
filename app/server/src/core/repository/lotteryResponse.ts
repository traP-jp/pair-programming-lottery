import type { LotteryResponse as PrismaLotteryResponse } from "@server/generated/prisma/client";
import type { LotteryResult } from "@server/core/services/lottery/format";

export type LotteryResponse = Omit<PrismaLotteryResponse, "result"> & {
    result: LotteryResult;
};

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
        result: object;
    }): Promise<LotteryResponse>;
}
