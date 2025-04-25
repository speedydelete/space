
import create, {Process, System, UserSession, FileSystem, join, Directory} from 'fake-system';
import {sqrt, sin, cos, acos, atan2, pi} from './util';
import {Obj, RootObj, OBJ_TYPE_MAP, ObjType, Position} from './obj';


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


function normalizeAngle(angle: number): number {
    angle %= 360;
    while (angle < 0) {
        angle += 360;
    }
    return angle;
}


export class World {

    system: System;
    fs: FileSystem;
    objDir: Directory;
    rootSession: UserSession;
    running: boolean = false;

    time: number = 0;
    timeWarp: number = 1;
    
    tickInterval: number | null = null;
    firstTickComplete: boolean = false;

    constructor(data?: Uint8Array) {
        this.system = create(data);
        this.fs = this.system.fs;
        if (!this.fs.exists('/home/objects')) {
            this.fs.mkdir('/home/objects');
        }
        this.objDir = this.fs.getDir('/home/objects');
        this.rootSession = this.system.login('root');
        if (!this.objDir.exists('.object')) {
            this.objDir.write('.object', JSON.stringify(new RootObj('', 'special:root')));
        }
        this.time = Date.now() / 1000;
        this.tick = this.tick.bind(this);
    }

    run(command: string): Process {
        return this.rootSession.runBash(command);
    }

    getObj(path: string): Obj {
        let data = JSON.parse(this.objDir.read(objJoin(path, '.object')));
        return Object.assign(Object.create(OBJ_TYPE_MAP[data.type as ObjType].prototype), data);
    }

    getParentPath(path: string): string {
        return path.split('/').slice(0, -1).join('/');
    }

    getParent(path: string): Obj {
        return this.getObj(this.getParentPath(path));
    }
    
    setObj(path: string, data: Obj): void {
        if (!this.objDir.exists(path)) {
            this.objDir.mkdir(path, true);
        }
        this.objDir.write(objJoin(path, '.object'), JSON.stringify(data));
    }

    getObjPaths(start: string, recursive: boolean = false): string[] {
        if (start.startsWith('/')) {
            start = start.slice(1);
        }
        let out: string[] = [];
        for (let [name, file] of this.objDir.getDir(start).files) {
            if (file instanceof Directory) {
                out.push(name);
                if (recursive) {
                    for (let path of this.getObjPaths(objJoin(start, name), true)) {
                        out.push(objJoin(name, path));
                    }
                }
            }
        }
        return out;
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

    setAbsolutePositions(start: string = '', [px, py, pz]: Position = [0, 0, 0]): void {
        for (let _path of this.getObjPaths(start)) {
            let path = join(start, _path);
            let obj = this.getObj(path);
            obj.absolutePosition[0] = obj.position[0] + px;
            obj.absolutePosition[1] = obj.position[1] + py;
            obj.absolutePosition[2] = obj.position[2] + pz;
            this.setObj(path, obj);
            this.setAbsolutePositions(path, obj.absolutePosition);
        }
    }

    tick(): void {
        let dt = 1/this.config.tps * this.timeWarp;
        this.time += dt;
        for (let path of this.getObjPaths('', true)) {
            let obj = this.getObj(path);
            let parent = this.getParent(path);
            // @ts-ignore
            if (!parent || parent.type === 'root') {
                continue;
            }
            let [x, y, z] = obj.position;
            let r3 = (x*x + y*y + z*z) ** 1.5;
            let accel = this.config.G * parent.mass / r3 * dt;
            obj.velocity[0] -= x * accel;
            obj.velocity[1] -= y * accel;
            obj.velocity[2] -= z * accel;
            obj.position[0] += obj.velocity[0] * dt;
            obj.position[1] += obj.velocity[1] * dt;
            obj.position[2] += obj.velocity[2] * dt;
            this.setObj(path, obj);
        }
        this.setAbsolutePositions();
        if (!this.firstTickComplete) {
            this.firstTickComplete = true;
        }
    }

    setPositionVelocityFromOrbit(path: string): void {
        let obj = this.getObj(path);
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
        let eca = mna;
        let delta: number;
        do {
            delta = (eca - ecc * sin(eca) - mna) / (1 - ecc * cos(eca));
            eca -= delta;
        } while (Math.abs(delta) > 1e-6);
        let tra = 2 * atan2(sqrt(1 + ecc) * sin(eca / 2), sqrt(1 - ecc) * cos(eca / 2));
        let dist = sma * (1 - ecc * cos(eca));
        let x = dist * cos(tra);
        let y = dist * sin(tra);
        let mu = this.config.G * (obj.mass + parent.mass);
        let vx = -sin(eca) * sqrt(mu * sma) / dist;
        let vy = sqrt(1 - ecc**2) * cos(eca) * sqrt(mu * sma) / dist;
        let R11 = cos(lan)*cos(aop) - sin(lan)*sin(aop)*cos(inc);
        let R12 = -cos(lan)*sin(aop) - sin(lan)*cos(aop)*cos(inc);
        let R21 = sin(lan)*cos(aop) + cos(lan)*sin(aop)*cos(inc);
        let R22 = -sin(lan)*sin(aop) + cos(lan)*cos(aop)*cos(inc);
        let R31 = sin(aop)*sin(inc);
        let R32 = cos(aop)*sin(inc);
        obj.position[0] = R11 * x + R12 * y;
        obj.position[2] = R21 * x + R22 * y;
        obj.position[1] = R31 * x + R32 * y;
        obj.velocity[0] = R11 * vx + R12 * vy;
        obj.velocity[2] = R21 * vx + R22 * vy;
        obj.velocity[1] = R31 * vx + R32 * vy;
        this.setObj(path, obj);
    }

    setOrbitFromPositionVelocity(path: string): void {
        let obj = this.getObj(path);
        if (!obj.orbit) {
            obj.orbit = {at: this.time, sma: 0, ecc: 0, mna: 0, inc: 0, lan: 0, aop: 0};
        }
        let parent = this.getParent(path);
        let [x, y, z] = obj.position;
        let [vx, vy, vz] = obj.velocity;
        let r = sqrt(x**2 + y**2 + z**2);
        let v = sqrt(vx**2 + vy**2 + vz**2);
        let hx = y * vz - z * vy;
        let hy = z * vx - x * vz;
        let hz = x * vy - y * vx;
        let h = sqrt(hx**2 + hy**2 + hz**2);
        obj.orbit.inc = acos(hz / h);
        let rx = x / r, ry = y / r, rz = z / r;
        let mu = this.config.G * (obj.mass + parent.mass);
        let evx = (vy * hz - vz * hy) / mu - rx;
        let evy = (vz * hx - vx * hz) / mu - ry;
        let evz = (vx * hy - vy * hx) / mu - rz;
        obj.orbit.ecc = sqrt(evx**2 + evy**2 + evz**2);
        let ecc = obj.orbit.ecc;
        obj.orbit.sma = 1 / (2 / r - v * v / mu);
        obj.orbit.lan = atan2(hx, -hy);
        obj.orbit.aop = atan2(-hy * evy - hx * evx, -hy * evx + hx * evy);
        let tra = atan2(hx * (vx * ry - vy * rx) + hy * (vy * rz - vz * ry) + hz * (vz * rx - vx * rz) / (h * obj.orbit.ecc), rx * evx + ry * evy + rz * evz);
        let eca = atan2((ecc + cos(tra)) / (1 + ecc * cos(tra)), sqrt(1 - ecc**2) * sin(tra) / (1 + ecc * cos(tra)));
        obj.orbit.mna = eca - ecc * sin(eca);
        this.setObj(path, obj);
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
        return this.system.export();
    }

}
