
import type {Time, Value} from './types.ts';

function type(value: any): string {
    if (value === undefined) {
        return 'undefined';
    } else if (value === null) {
        return 'null';
    }
    const type = typeof value;
    if (type == 'number' || type == 'string' || type == 'bigint' || type == 'symbol') {
        return type;
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
    time = resolveValue(time, time);
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

function resolveValue<T>(value: Value<T>, time: Time): T {
    if (Array.isArray(value)) {
        return value.map((c) => resolveValue(c, time)).reduce(([x, y]) => x + y);
    } else if (typeof value == 'object' && value.type) {
        if (value.type == 'fixed') {
            return resolveValue(value.value, time);
        } else if (value.type == 'linear') {
            return value.min + timeDiff(time, value.epoch)/value.period * value.max;
        } else {
            throw new TypeError(`Value type '${value.type}' is not recognized`)
        }
    } else {
        throw new TypeError(`value '${value}' is invalid`);
    }
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
        return Math.round(value/9.4607e15, 4) + ' ly';
    }
}

export {
    type,
    getTime,
    timeDiff,
    formatTime,
    formatLength,
}
