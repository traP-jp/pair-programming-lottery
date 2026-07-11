function calculateStringHash(string_: string, initialHash = 5381): number {
    let hash = initialHash;
    for (let index = 0; index < string_.length; index++) {
        hash = (hash << 5) + hash + string_.charCodeAt(index);
    }
    return hash;
}

export function calculateArrayHash(array: string[]): string {
    const hash = array.reduce((accumulator, string_) => calculateStringHash(string_, accumulator), 5381);
    return hash.toString(16);
}
