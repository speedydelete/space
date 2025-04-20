
export function formatLength(value: number): string {
    return value + ' m';
}

export function formatTime(value: number): string {
    return value + ' s';
}

export function formatDate(value: number): string {
    return (new Date(value)).toLocaleString();
}
