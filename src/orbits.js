
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

function getAnomalies(object, parent, time, tol=1e-6) {
    const ecc = object.orbit.ecc;
    const meanA = config.G*(object.mass + parent.mass)*((time.getTime() - object.orbit.top.getTime())/1000);
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
    return (orbit.sma * (1 - orbit.ecc**2))/(1 + orbit.ecc*Math.cos(anomalies.mean));
}

function getPosition(object, parent, time, tol=1e-6) {
    const anomalies = getAnomalies(object, parent, time, tol);
    const radius = getRadius(object.orbit, anomalies);
    let vec = [radius * Math.cos(anomalies.true), radius * Math.sin(anomalies.true), 0];
    vec = rotateVector(vec, -object.orbit.pe, 'z');
    vec = rotateVector(vec, -object.orbit.inc, 'x');
    vec = rotateVector(vec, -object.orbit.lan, 'z');
    return vec;
}

export {
    rotateVector,
    getAnomalies,
    getRadius,
    getPosition,
}
