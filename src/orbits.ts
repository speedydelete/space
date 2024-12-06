
import type {Time, Object_, OrbitObject} from './types.ts';
import {timeDiff} from './util.ts';
import type {World} from './world.ts';

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

function getAop(world: World, object: OrbitObject, time: Time): number {
    const {sma, period, ecc, aopEpoch} = object.orbit;
    const aopPeriod = 24 * Math.PI**3 * sma**2 / period**2 / world.config.c**2 / (1 - ecc**2);
    return timeDiff(time, aopEpoch)/aopPeriod * 360;
}

function getAnomalies(world: World, object: OrbitObject, tol: number = 1e-6): {mna: number, eca: number, tra: number} {
    const {ecc, period, top} = object.orbit;
    const mna = Math.abs(timeDiff(world.time, top)) / period;
    let eca = mna;
    let delta: number;
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

function getOrbitalRadius(object: OrbitObject, tra: number): number {
    return (object.orbit.sma * (1 - object.orbit.ecc**2))/(1 + object.orbit.ecc*Math.cos(tra));
}

function getPosition(world: World, object: Object_, tol=1e-6): Position {
    if (object.hasOrbit()) {
        const {tra} = getAnomalies(world, object, tol);
        const radius = getOrbitalRadius(object, tra);
        let pos: Position = [radius * Math.cos(tra), radius * Math.sin(tra), 0];
        pos = rotateVector(pos, -object.orbit.lan*Math.PI/180, 'z');
        pos = rotateVector(pos, -object.orbit.inc*Math.PI/180, 'x');
        pos = rotateVector(pos, -object.orbit.aop*Math.PI/180, 'z');
        return pos;
    } else {
        return object.position;
    }
}

export {
    getAop,
    getAnomalies,
    getOrbitalRadius,
    getPosition,
}
