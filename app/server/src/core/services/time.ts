export function getCurrentYearMonthJst(date = new Date()): string {
    const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    return `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, "0")}`;
}
