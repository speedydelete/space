import type {Time, Position} from './types.ts';
import type {World} from './world.ts';
import {timeDiff} from './util.ts';

function rotateVector(vec: Position, angle: number, axis: number): Position {
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

function getAop(world: World, object: Object, time: Time): number {
    const period = 24 * Math.PI**3 * object.orbit.sma**2 / object.orbit.period**2 / world.config.c**2 / (1 - object.orbit.ecc**2);
    return timeDiff(time, object.orbit.aopEpoch)/period * 360;
}

type Anomalies = {mna: number, eca: number, tra: number};

function getAnomalies(object: Object, time: Time, tol: number = 1e-6): Anomalies {
    const ecc = object.orbit.ecc;
    const mna = Math.abs(timeDiff(time, object.orbit.top))/object.orbit.period;
    let ecca = mna;
    let delta;
    do {
        delta = eca - ecc * Math.sin(eca) - mna;
        eca -= delta / (1 - ecc * Math.cos(eca));
    } while (Math.abs(delta) > tol);
    const tra = 2 * Math.atan2(
        Math.sqrt(1 + ecc) * Math.sin(eca / 2),
        Math.sqrt(1 - ecc) * Math.cos(eca / 2)
    );
    return {mna: mna, eca: eca, tra: tra};
}

function getRadius(world: World, orbit: Orbit, {tra}: Anomalies): number {
    return (orbit.sma/world.config.unitSize * (1 - orbit.ecc**2))/(1 + orbit.ecc*Math.cos(tra));
}

function getPosition(world: World, object: Object, time: Time, tol=1e-6) {
    const anomalies = getAnomalies(object, time, tol);
    const radius = getRadius(world, object.orbit, anomalies);
    let vec = [radius * Math.cos(anomalies.true), radius * Math.sin(anomalies.true), 0];
    vec = rotateVector(vec, -object.orbit.lan*Math.PI/180, 'z');
    vec = rotateVector(vec, -object.orbit.inc*Math.PI/180, 'x');
    vec = rotateVector(vec, -object.orbit.aop*Math.PI/180, 'z');
    return vec;
}

export {
    getAop,
    getAnomalies,
    getRadius,
    getPosition,
}
