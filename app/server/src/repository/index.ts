import { PrismaScheduleRepository } from "@server/repository/prisma/schedule";
import { PrismaLotteryResponseRepository } from "@server/repository/prisma/lotteryResponse";

export type { IScheduleRepository } from "@server/repository/schedule";
export type { ILotteryResponseRepository } from "@server/repository/lotteryResponse";

export const scheduleRepository = new PrismaScheduleRepository();
export const lotteryResponseRepository = new PrismaLotteryResponseRepository();
