import { prisma } from "@server/external/db";
import type { Schedule, Prisma } from "@server/generated/prisma/client";
import type { IScheduleRepository } from "@server/repository/schedule";

export class PrismaScheduleRepository implements IScheduleRepository {
    async get(): Promise<Schedule | null> {
        return prisma.schedule.findUnique({ where: { id: 1 } });
    }

    async upsert(
        data: Omit<Prisma.ScheduleUpsertArgs["create"], "id">,
    ): Promise<Schedule> {
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
