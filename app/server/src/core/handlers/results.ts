import { prisma } from "../../external/db";

export const getResultsHandler = () => {
    const records = prisma.lotteryResult.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, createdAt: true, channelId: true, month: true },
    });
    return records;
};

export const getResultHandler = async (id: string) => {
    const record = await prisma.lotteryResult.findUnique({
        where: { id },
    });
    if (!record) return null;
    return record;
};
