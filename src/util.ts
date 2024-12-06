
import type {Time} from './types.ts';

function type(value: any): string {
    if (value === undefined) {
        ((value): value is undefined => true)(value)
        return 'undefined';
    } else if (value === null) {
        ((value): value is null => true)(value)
        return 'null';
    }
    const type = typeof value;
    if (type == 'number') {
        return 'number';
    } else if (type == 'string') {
        return 'string';
    } else if (type == 'bigint') {
        return 'bigint';
    } else if (type == 'symbol') {
        return 'symbol';
    } else if (type == 'object') {
        if (value[Symbol.toStringTag]) {
            return value[Symbol.toStringTag];
        } else if (Array.isArray(value)) {
            return 'array';
        } else if (value instanceof Number) {
            return 'number';
        } else if (value instanceof String) {
            return 'string';
        } else {
            return 'object';
        }
    } else if (type == 'function') {
        if (Function.prototype.toString.call(value).startsWith('class')) {
            return 'class';
        } else {
            return 'function';
        }
    } else if (type == 'undefined' && value == undefined && value !== undefined) {
        return 'document.all';
    } else {
        return 'unknown';
    }
}

function getTime(time?: Time): number {
    if (typeof time == 'number') {
        return time;
    } else if (time === undefined) {
        return (new Date()).getTime() / 1000;
    } else if (time instanceof Date) {
        return time.getTime() / 1000;
    } else {
        return (new Date(time)).getTime() / 1000;
    }
}

function timeDiff(time1: Time, time2: Time): number {
    return getTime(time1) - getTime(time2);
}

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
        return round(value/9.4607e15, 4) + ' ly';
    }
}

export {
    type,
    getTime,
    timeDiff,
    formatTime,
    formatLength,
}
