
const {abs} = Math;

function round(value, digits) {
    return Math.round(value * 10**digits) / 10**digits
}

function formatTime(value) {
    if (abs(value) < 60) {
        return round(value, 2) + ' s';
    } else if (abs(value) < 3600) {
        return round(value/60, 2) + ' min';
    } else if (abs(value) < 86400) {
        return round(value/3600, 2) + ' h';
    } else if (abs(value) < 31536000) {
        return round(value/86400, 2) + ' d';
    } else {
        return round(value/31536000, 2) + ' y';
    }
}

function formatLength(value) {
    if (abs(value) < 1000) {
        return round(value, 2) + ' m';
    } else if (abs(value) < 1e9) {
        return round(value/1000, 2) + ' km';
    } else if (abs(value) < 1e15) {
        return round(value/1.495978707e11, 2) + ' AU';
    } else {
        return Math.round(value/9.4607e15, 2) + ' ly';
    }
}

export {
    formatTime,
    formatLength,
}
