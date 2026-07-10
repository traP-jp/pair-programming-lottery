const jstDateTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
});

export function formatJstDateTime(value: string) {
    return jstDateTimeFormatter.format(new Date(value));
}
