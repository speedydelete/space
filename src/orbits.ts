
import type {Time, Orbit, Object} from './types.ts';
import {timeDiff} from './util.ts';
import {type World, resolveValue} from './world.ts';

type Position = [number, number, number];

function rotateVector(vec: Position, angle: number, axis: 'x' | 'y' | 'z'): Position {
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
    const {sma, period, ecc, aopEpoch} = object.orbit;
    const aopPeriod = 24 * Math.PI**3 * resolveValue(sma, world)**2 / resolveValue(period, world)**2 / resolveValue(world.config.c, world)**2 / (1 - resolveValue(ecc, world)**2);
    return timeDiff(time, resolveValue(aopEpoch, world))/aopPeriod * 360;
}

type Anomalies = {mna: number, eca: number, tra: number};

function getAnomalies(world: World, object: Object, tol: number = 1e-6): Anomalies {
    const {top, period} = object.orbit;
    const ecc = resolveValue(object.orbit.ecc, world);
    const mna = Math.abs(timeDiff(world.time, resolveValue(top, world)))/resolveValue(period, world);
    let eca = mna;
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
    const ecc = resolveValue(orbit.ecc, world)
    return (resolveValue(orbit.sma, world) * (1 - ecc**2))/(1 + ecc*Math.cos(tra));
}

function getPosition(world: World, object: Object, time: Time, tol=1e-6): Position {
    // if (object.orbit === undefined) {
    //     return resolveValue(object.position, world);
    // }
    const anomalies = getAnomalies(world, object, tol);
    const radius = getRadius(world, object.orbit, anomalies);
    let vec: Position = [radius * Math.cos(anomalies.tra), radius * Math.sin(anomalies.tra), 0];
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
