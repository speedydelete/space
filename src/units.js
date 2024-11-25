
function formatLength(value) {
    if (Math.abs(value) < 1000) {
        return Math.round(value*100)/100 + ' m';
    } else if (Math.abs(value) < 1e9) {
        return Math.round(value/10)/100 + ' km';
    } else if (Math.abs(value) < 1e15) {
        return Math.round(value/1.495978707e9)/100 + ' AU';
    } else {
        return Math.round(value/9.4607e13)/100 + ' ly';
    }
}

export {
    formatLength,
}
