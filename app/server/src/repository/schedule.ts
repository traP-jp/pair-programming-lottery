import type { Schedule, Prisma } from "@server/generated/prisma/client";

export interface IScheduleRepository {
    get(): Promise<Schedule | null>;
    upsert(
        data: Omit<Prisma.ScheduleUpsertArgs["create"], "id">,
    ): Promise<Schedule>;
    update(data: Prisma.ScheduleUpdateInput): Promise<Schedule>;
}
