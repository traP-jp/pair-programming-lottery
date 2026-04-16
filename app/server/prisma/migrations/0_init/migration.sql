-- CreateTable
CREATE TABLE `Schedule` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `channelId` VARCHAR(36) NOT NULL,
    `postDay` INTEGER NOT NULL,
    `lotteryDay` INTEGER NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `lastPostedAt` DATETIME(3) NULL,
    `lastMessageId` VARCHAR(36) NULL,
    `lastLotteryAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LotteryResponse` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `channelId` VARCHAR(36) NOT NULL,
    `month` VARCHAR(7) NOT NULL,
    `result` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
