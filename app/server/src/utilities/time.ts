export function getJstDate(date = new Date()): Date {
    // Note: If you still need a Date object strictly shifted by +9 hours for some legacy usage:
    return new Date(date.getTime() + 9 * 60 * 60 * 1000);
}

export function getCurrentYearMonthJst(date = new Date()): string {
    const formatter = new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
    });
    return formatter.format(date).replace("/", "-");
}

export function getJstDay(date = new Date()): number {
    const formatter = new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        day: "numeric",
    });
    return Number.parseInt(formatter.format(date), 10);
}

export function isThisMonthJst(isoDateTime: Date | null, yearMonth: string): boolean {
    if (!isoDateTime) return false;
    return getCurrentYearMonthJst(isoDateTime) === yearMonth;
}
