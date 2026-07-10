export function getPairKey(firstUserId: string, secondUserId: string) {
    return [firstUserId, secondUserId].sort().join(":");
}
