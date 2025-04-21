
const {abs} = Math;

export function formatLength(value: number): string {
    if (isNaN(value)) {
        return 'NaN';
    } else if (abs(value) > 946073047258080) {
        return (value/9460730472580.8e3).toFixed(3) + ' ly';
    } else if (abs(value) > 14959787070) {
        return (value/149597870700).toFixed(3) + ' AU';
    } else if (abs(value) > 1000) {
        return (value/1000).toFixed(3) + ' km';
    } else {
        return value.toFixed(3) + ' m';
    }
}

export function formatTime(value: number): string {
    if (isNaN(value)) {
        return 'NaN';
    } else if (value > 31536000) {
        return (value/31536000).toFixed(3) + ' y';
    } else if (value > 86400) {
        return (value/86400).toFixed(3) + ' d';
    } else if (value > 3600) {
        return (value/3600).toFixed(3) + ' h';
    } else if (value > 60) {
        return (value/60).toFixed(3) + ' m';
    } else {
        return value.toFixed(3) + 's';
    }
}

export function formatDate(value: number): string {
    if (isNaN(value)) {
        return 'NaN';
    }
    return (new Date(value*1000)).toISOString().replace('T', ' ').replace('Z', '');
}
