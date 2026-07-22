export function getUnixTimestamp(): number {
    return Math.floor(Date.now()); // return Unix timestamp (milliseconds)
}

export function getRemainingTimeString (timestamp: number): string {
    if (timestamp === -1) {
        return '∞';
    }

    const date = new Date(timestamp - Date.now());
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();

    let resultString = '';
    if (hours > 0) {
        resultString += `${hours}h `;
    }
    resultString += `${minutes + 1}m`

    return resultString;
}