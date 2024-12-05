import {getTime} from './util.ts'

const {abs} = Math;

function round(value: number, digits: number = 0): number {
    return Math.round(value * 10**digits) / 10**digits
}

function formatTime(value: number): string {
    if (abs(value) < 60) {
        return round(value, 4) + ' s';
    } else if (abs(value) < 3600) {
        return round(value/60, 4) + ' min';
    } else if (abs(value) < 86400) {
        return round(value/3600, 4) + ' h';
    } else if (abs(value) < 31536000) {
        return round(value/86400, 4) + ' d';
    } else {
        return round(value/31536000, 4) + ' y';
    }
}

function formatLength(value: number): string {
    if (abs(value) < 1000) {
        return round(value, 4) + ' m';
    } else if (abs(value) < 1e9) {
        return round(value/1000, 4) + ' km';
    } else if (abs(value) < 1e15) {
        return round(value/1.495978707e11, 4) + ' AU';
    } else {
        return Math.round(value/9.4607e15, 4) + ' ly';
    }
}

export {
    formatTime,
    formatLength,
}
