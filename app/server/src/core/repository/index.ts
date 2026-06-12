import { PrismaLotteryResponseRepository } from "@server/core/repository/prisma/lotteryResponse";
import { PrismaScheduleRepository } from "@server/core/repository/prisma/schedule";

export type { IScheduleRepository } from "@server/core/repository/schedule";
export type { ILotteryResponseRepository } from "@server/core/repository/lotteryResponse";

export const scheduleRepository = new PrismaScheduleRepository();
export const lotteryResponseRepository = new PrismaLotteryResponseRepository();
