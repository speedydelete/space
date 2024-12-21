
import {type Time, timeDiff} from './util';
import type {Obj, OrbitObj} from './obj';
import type {World} from './world';

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

function getPeriod(G: number, object: OrbitObj, parent: Obj) {
    return 2 * Math.PI * Math.sqrt(object.orbit.sma ** 3 / G / parent.mass);
}

// function getAop(world: World, object: OrbitObj, time: Time): number {
//     const {sma, period, ecc, aopEpoch} = object.orbit;
//     const aopPeriod = 24 * Math.PI**3 * sma**2 / period**2 / world.config.c**2 / (1 - ecc**2);
//     return timeDiff(time, aopEpoch)/aopPeriod * 360;
// }

function getAnomalies(object: OrbitObj, tol: number = 1e-6): {mna: number, eca: number, tra: number} {
    const ecc = object.orbit.ecc === undefined ? 0 : object.orbit.ecc;
    let mna = object.orbit.mna;
    if (mna === undefined) throw new TypeError('no mna');
    mna /= 360;
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

function getOrbitalRadius(object: OrbitObj, tra: number): number {
    const ecc = object.orbit.ecc === undefined ? 0 : object.orbit.ecc;
    return (object.orbit.sma * (1 - (ecc **2))/(1 + ecc*Math.cos(tra)));
}

function getPosition(world: World, object: Obj, parent: Obj | null = null, tol: number = 1e-6): Position {
    if (object.hasOrbit()) {
        if (!object.orbit.mna) object.orbit.mna = 0;
        if (parent !== null) object.orbit.mna += 360 * (world.timeWarp / world.tps)/getPeriod(world.config.G, object, parent);
        const {tra} = getAnomalies(object, tol);
        const radius = getOrbitalRadius(object, tra);
        let pos: Position = [radius * Math.cos(tra), radius * Math.sin(tra), 0];
        if (object.orbit.lan !== undefined) pos = rotateVector(pos, -object.orbit.lan*Math.PI/180, 'z');
        if (object.orbit.inc !== undefined) pos = rotateVector(pos, -object.orbit.inc*Math.PI/180, 'x');
        if (object.orbit.aop !== undefined) pos = rotateVector(pos, -object.orbit.aop*Math.PI/180, 'z');
        return pos;
    } else {
        return object.position;
    }
}

export {
    getPeriod,
    // getAop,
    getAnomalies,
    getOrbitalRadius,
    getPosition,
}
