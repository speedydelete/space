
import {config} from './config.js'

function rotateVector(vec, angle, axis) {
    const [x, y, z] = vec;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    if (axis === 'x') {
        return [
            x,
            y * cosA - z * sinA,
            y * sinA + z * cosA
        ];
    } else if (axis === 'y') {
        return [
            x * cosA + z * sinA,
            y,
            -x * sinA + z * cosA
        ];
    } else if (axis === 'z') {
        return [
            x * cosA - y * sinA,
            x * sinA + y * cosA,
            z
        ];
    }
    return vec;
}

function getAnomalies(object, time, tol=1e-6) {
    const ecc = object.orbit.ecc;
    const meanA = Math.abs(time.getTime() - new Date(object.orbit.top).getTime())/1000/object.orbit.period;
    let eccA = meanA;
    let delta;
    do {
        delta = eccA - ecc * Math.sin(eccA) - meanA;
        eccA -= delta / (1 - ecc * Math.cos(eccA));
    } while (Math.abs(delta) > tol);
    const trueA = 2 * Math.atan2(
        Math.sqrt(1 + ecc) * Math.sin(eccA / 2),
        Math.sqrt(1 - ecc) * Math.cos(eccA / 2)
    );
    return {
        mean: meanA,
        ecc: eccA,
        true: trueA,
    };
}

function getRadius(orbit, anomalies) {
    return (orbit.sma/config.unitSize * (1 - orbit.ecc**2))/(1 + orbit.ecc*Math.cos(anomalies.true));
}

function getPosition(object, time, tol=1e-6) {
    const anomalies = getAnomalies(object, time, tol);
    const radius = getRadius(object.orbit, anomalies);
    let vec = [radius * Math.cos(anomalies.true), radius * Math.sin(anomalies.true), 0];
    vec = rotateVector(vec, -object.orbit.lan*Math.PI/180, 'z');
    vec = rotateVector(vec, -object.orbit.inc*Math.PI/180, 'x');
    vec = rotateVector(vec, -object.orbit.aop*Math.PI/180, 'z');
    return vec;
}

export {
    getAnomalies,
    getRadius,
    getPosition,
}
