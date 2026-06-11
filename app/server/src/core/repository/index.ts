import { PrismaScheduleRepository } from "@server/core/repository/prisma/schedule";
import { PrismaLotteryResponseRepository } from "@server/core/repository/prisma/lotteryResponse";

export type { IScheduleRepository } from "@server/core/repository/schedule";
export type { ILotteryResponseRepository } from "@server/core/repository/lotteryResponse";

export const scheduleRepository = new PrismaScheduleRepository();
export const lotteryResponseRepository = new PrismaLotteryResponseRepository();
