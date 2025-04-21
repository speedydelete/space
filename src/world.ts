
import create, {Process, System, UserSession, FileSystem, join, Directory} from 'fake-system';
import {Obj, RootObj, OBJ_TYPE_MAP, ObjType} from './obj';


export interface Config {
    tps: number,
    c: number,
    G: number,
    lC: number,
    initialTarget: string,
}


const {abs, sqrt, PI: pi} = Math;
const sin = (x: number) => Math.sin(x * pi / 180);
const cos = (x: number) => Math.cos(x * pi / 180);
const atan2 = (x: number, y: number) => Math.atan2(x, y) * 180 / pi;

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
    tickInterval: number | null = null;

    time: number = 0;
    timeWarp: number = 1;

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

    saveState(): void {
        this.fs.write('/etc/time', this.time.toString());
        this.fs.write('/etc/time_warp', this.timeWarp.toString());
    }

    getJD(): number {
        return this.time / 86400 + 2440587.5;
    }

    tick(): void {
        this.time += 1/this.config.tps;
        for (let path of this.getObjPaths('', true)) {
            let obj = this.getObj(path);
            if (obj.orbit) {
                let {sma, ecc, mna, inc, lan, aop} = obj.orbit;
                let per = 2 * pi * sqrt(sma ** 3 / obj.mass / this.config.G) / 86400;
                mna = normalizeAngle(mna + 360 * (this.getJD() - 2451545.0) / per) / this.config.tps;
                obj.orbit.mna = mna;
                let eca = mna;
                let delta;
                do {
                    delta = (eca - ecc*sin(eca) - mna) / (1 - ecc*cos(eca));
                    eca -= delta;
                } while (abs(delta) > 1e-6);
                let tra = 2 * atan2(sqrt(1 + ecc) * sin(eca / 2), sqrt(1 - ecc) * cos(eca / 2));
                let r = sma * (1 - ecc**2) / (1 - ecc * cos(tra));
                let x = r * (cos(lan) * cos(tra + aop) - sin(lan) * sin(tra + aop) * cos(inc));
                let y = r * (sin(lan) * cos(tra + aop) + cos(lan) * sin(tra + aop) * cos(inc));
                let z = r * (sin(tra + aop) * sin(inc));
                let parent = this.getObj(path.split('/').slice(0, -1).join('/'));
                x += parent.position[0];
                y += parent.position[1];
                z += parent.position[2];
                obj.position = [x, z, y];
                this.setObj(path, obj);
            }
        }
    }

    start(): void {
        // @ts-ignore
        this.tickInterval = setInterval(this.tick, 1000/this.config.tps);
    }

    stop(): void {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
        }
    }

    export(): Uint8Array {
        return this.system.export();
    }

}
