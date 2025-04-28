
import create, {Process, System, UserSession, FileSystem, join} from 'fake-system';
import {sqrt, sin, cos, acos, atan2, pi, Vector3, Matrix3, normalizeAngle} from './util';
import {ObjDir, Obj} from './obj';
import settings from './settings';


export interface Config {
    tps: number,
    c: number,
    G: number,
    lC: number,
    initialTarget: string,
}


export function objJoin(...paths: string[]) {
    let out = join(...paths);
    if (out.startsWith('/')) {
        out = out.slice(1);
    }
    return out;
}


export class World extends ObjDir {

    system: System;
    fs: FileSystem;
    rootSession: UserSession;
    running: boolean = false;

    time: number = 0;
    timeWarp: number = 1;
    
    tickInterval: number | null = null;

    constructor(data?: Uint8Array) {
        super();
        this.system = create(data);
        this.fs = this.system.fs;
        if (this.fs.exists('/home/objects')) {
            this.fromDir('', this.fs.getDir('/home/objects'));
        } else {
            this.fs.link('/home/objects', this);
        }
        this.rootSession = this.system.login('root');
        this.time = Date.now() / 1000;
        this.tick = this.tick.bind(this);
    }

    run(command: string): Process {
        return this.rootSession.runBash(command);
    }

    get config(): Config {
        return JSON.parse(this.fs.read('/etc/config'));
    }

    set config(value: Config) {
        this.fs.write('/etc/config', JSON.stringify(value));
    }

    setConfig<T extends keyof Config>(key: T, value: Config[T]): void {
        let config = JSON.parse(this.fs.read('/etc/config'));
        config[key] = value;
        this.fs.write('/etc/config', JSON.stringify(config));
        if (key === 'tps') {
            this.restart();
        }
    }

    saveState(): void {
        this.fs.write('/etc/time', this.time.toString());
        this.fs.write('/etc/time_warp', this.timeWarp.toString());
    }

    getJD(): number {
        return this.time / 86400 + 2440587.5;
    }

    applyForce(obj: Obj, other: Obj, dt: number): void {
        let d = obj.position.sub(other.position);
        let dist = d.abs()**3;
        if (dist === 0) {
            return;
        }
        let force = this.config.G * other.mass / dist * dt;
        obj.velocity = obj.velocity.sub(d.mul(force));
    }

    tick(): void {
        let dt = 1 / this.config.tps * this.timeWarp;
        this.time += dt;
        for (let [path, obj] of this.objs.entries()) {
            if (!obj.gravity) {
                continue;
            }
            if (obj.nbody) {
                for (let other of this.objs.values()) {
                    if (obj !== other) {
                        this.applyForce(obj, other, dt);
                    }
                }
            } else if (obj.useOrbitForGravity) {
                this.setPositionVelocityFromOrbit(path, true, false);
            } else {
                let parent = this.getParent(path);
                // @ts-ignore
                if (parent && parent.type !== 'root') {
                    this.applyForce(obj, parent, dt);
                }
            }
        }
        for (let obj of this.objs.values()) {
            obj.position = obj.position.add(obj.velocity.mul(dt));
            obj.rotation = obj.rotation.add(obj.rotationChange.mul(dt)).normalizeAngles();
        }
    }

    setPositionVelocityFromOrbit(path: string, setPosition: boolean = true, setVelocity: boolean = true): void {
        let obj = this.get(path);
        if (!obj.orbit) {
            throw new Error('this error should not occur');
        }
        let parent = this.getParent(path);
        let {at, sma, ecc, mna, inc, lan, aop} = obj.orbit;
        if (obj.orbit.aopPrecession) {
            aop += obj.orbit.aopPrecession * (this.time - at);
        }
        if (path === 'sun/earth') {
            let T = (this.time/86400 - 10957.5) / 36525;
            ecc += 0.000042037 * cos(360 / 112000 * T * 100);
            lan = normalizeAngle(lan + 0.323 * T);
        }
        let per = 2 * pi * sqrt(sma ** 3 / parent.mass / this.config.G);
        mna = normalizeAngle(mna + 360 * (this.time - at) / per);
        obj.orbit.at = this.time;
        obj.orbit.mna = mna;
        let eca = mna;
        let delta: number;
        do {
            delta = (eca - ecc * sin(eca) - mna) / (1 - ecc * cos(eca));
            eca -= delta;
        } while (Math.abs(delta) > settings.keplerTolerance);
        let tra = 2 * atan2(sqrt(1 + ecc) * sin(eca / 2), sqrt(1 - ecc) * cos(eca / 2));
        let dist = sma * (1 - ecc * cos(eca));
        let mu = this.config.G * (obj.mass + parent.mass);
        let matrix = new Matrix3([
            [cos(lan)*cos(aop) - sin(lan)*sin(aop)*cos(inc), -cos(lan)*sin(aop) - sin(lan)*cos(aop)*cos(inc), 0],
            [sin(lan)*cos(aop) + cos(lan)*sin(aop)*cos(inc), -sin(lan)*sin(aop) + cos(lan)*cos(aop)*cos(inc), 0],
            [sin(aop)*sin(inc), cos(aop)*sin(inc), 0],
        ]);
        if (setPosition) {
            let vec = new Vector3(dist * cos(tra), dist * sin(tra));
            obj.position = vec.mul(matrix).add(parent.position);
        }
        if (setVelocity) {
            let vx = -sin(eca) * sqrt(mu * sma) / dist;
            let vy = sqrt(1 - ecc**2) * cos(eca) * sqrt(mu * sma) / dist;
            let vec = new Vector3(vx, vy, 0);
            obj.velocity = vec.mul(matrix).add(parent.velocity);
        }
    }

    setOrbitFromPositionVelocity(path: string): void {
        let obj = this.get(path);
        if (!obj.orbit) {
            obj.orbit = {at: this.time, sma: 0, ecc: 0, mna: 0, inc: 0, lan: 0, aop: 0};
        }
        let orbit = obj.orbit;
        let parent = this.getParent(path);
        let r = obj.position.abs();
        let v = obj.velocity.abs();
        let mu = this.config.G * (obj.mass + parent.mass);
        orbit.sma = 1 / (2/r - v**2 / mu);
        let soe = v**2 / 2 - mu / r;
        let srae = obj.position.cross(obj.velocity);
        let h = srae.abs();
        orbit.ecc = sqrt(1 + 2*soe*h**2/mu**2);
        orbit.inc = acos(srae.z / h);
        let n = sqrt(srae.x**2 + srae.y**2);
        orbit.lan = acos(-srae.y / n);
        if (isNaN(orbit.lan)) {
            orbit.lan = 0;
        }
        if (srae.x < 0) {
            orbit.lan = normalizeAngle(360 - orbit.lan);
        }
        let ev = obj.velocity.cross(srae).div(mu);
        orbit.aop = atan2(ev.y, ev.x);
        let tra = acos(ev.dot(obj.position) / ev.abs() / r);
        let eca = atan2(sqrt(1 - orbit.ecc**2) * sin(tra), orbit.ecc + cos(tra));
        orbit.mna = eca - orbit.ecc * sin(eca);
    }

    start(): void {
        // @ts-ignore
        this.tickInterval = setInterval(this.tick, 1000/this.config.tps);
        this.running = true;
    }

    stop(): void {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
        }
        this.running = false;
    }

    restart(): void {
        this.stop();
        this.start();
    }

    export(): Uint8Array {
        this.fs.link('/home/objects', this.toDir());
        let out = this.system.export();
        this.fs.link('/home/objects', this);
        return out;
    }

}
