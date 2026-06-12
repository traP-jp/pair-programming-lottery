import type { IScheduleRepository } from "@server/core/repository/schedule";
import { prisma } from "@server/external/database";
import type { Prisma, Schedule } from "@server/generated/prisma/client";

export class PrismaScheduleRepository implements IScheduleRepository {
    constructor() {}

    async get(): Promise<Schedule | null> {
        return prisma.schedule.findUnique({ where: { id: 1 } });
    }

    async upsert(data: Omit<Prisma.ScheduleUpsertArgs["create"], "id">): Promise<Schedule> {
        return prisma.schedule.upsert({
            where: { id: 1 },
            create: { id: 1, ...data },
            update: data,
        });
    }

    async update(data: Prisma.ScheduleUpdateInput): Promise<Schedule> {
        return prisma.schedule.update({
            where: { id: 1 },
            data,
        });
    }
}
