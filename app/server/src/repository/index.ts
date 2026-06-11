import { PrismaScheduleRepository } from "./prisma/schedule";
import { PrismaLotteryResponseRepository } from "./prisma/lotteryResponse";

export type { IScheduleRepository } from "./schedule";
export type { ILotteryResponseRepository } from "./lotteryResponse";

export const scheduleRepository = new PrismaScheduleRepository();
export const lotteryResponseRepository = new PrismaLotteryResponseRepository();
