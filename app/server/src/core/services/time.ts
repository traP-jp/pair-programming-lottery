export function getJstDate(date = new Date()): Date {
    return new Date(date.getTime() + 9 * 60 * 60 * 1000);
}

export function getCurrentYearMonthJst(date = new Date()): string {
    const jst = getJstDate(date);
    return `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function isThisMonthJst(isoDateTime: Date | null, yearMonth: string): boolean {
    if (!isoDateTime) return false;
    return getCurrentYearMonthJst(isoDateTime) === yearMonth;
}
