
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

const MOON_TABLE_1 = [
    [0, 0, 1, 0, 6288774, -20905355],
    [2, 0, -1, 0, 1274027, -3699111],
    [2, 0, 0, 0, 658314, -2955968],
    [0, 0, 2, 0, 213618, -569925],
    [0, 1, 0, 0, -185116, 48888],
    [0, 0, 0, 2, -114332, -3149],
    [2, 0, -2, 0, 58793, 246158],
    [2, -1, -1, 0, 57066, -152138],
    [2, 0, 1, 0, 53322, -170733],
    [2, -1, 0, 0, 45758, -204586],
    [0, 1, -1, 0, -40923, -129620],
    [1, 0, 0, 0, -34720, 108743],
    [0, 1, 1, 0, -30383, 104755],
    [2, 0, 0, -2, -12528, 0],
    [0, 0, 1, -2, 10980, 79661],
    [4, 0, -1, 0, 10675, -34782],
    [0, 0, 3, 0, 10034, -23210],
    [4, 0, -2, 0, 8548, -21636],
    [2, 1, -1, 0, -7888, 24208],
    [2, 1, 0, 0, -6766, 30824],
    [1, 0, -1, 0, -5153, -8379],
    [1, 1, 0, 0, 4987, -16675],
    [2, -1, 1, 0, 4036, -12831],
    [2, 0, 2, 0, 3994, -10445],
    [4, 0, 0, 0, 3861, -11650],
    [2, 0, -3, 0, 3665, 14403],
    [0, 1, -2, 0, -2689, -7003],
    [2, 0, -1, -2, -2602, 0],
    [2, -1, -2, 0, 2390, 10056],
    [1, 0, 1, 0, -2348, 6322],
    [2, -2, 0, 0, 2236, -9884],
    [0, 1, 2, 0, -2120, 5751],
    [0, 2, 0, 0, -2069, 0],
    [2, -2, -1, 0, 2048, -4950],
    [2, 0, 1, -2, -1773, 4130],
    [2, 0, 0, 2, -1595, 0],
    [4, -1, -1, 0, 1215, -3958],
    [0, 0, 2, 2, -1110, 0],
    [3, 0, -1, 0, -892, 3258],
    [2, 1, 1, 0, -810, 2616],
    [4, -1, -2, 0, 759, -1897],
    [2, 2, -1, 0, -700, 2354],
    [2, 1, -2, 0, 691, 0],
    [2, -1, 0, -2, 596, 0],
    [4, 0, 1, 0, 549, -1423],
    [0, 0, 4, 0, 537, -1117],
    [4, -1, 0, 0, 520, -1571],
    [1, 0, -2, 0, -487, -1739],
    [2, 1, 0, -2, -399, 0],
    [0, 0, 2, -2, -381, -4421],
    [1, 1, 1, 0, 351, 0],
    [3, 0, -2, 0, -340, 0],
    [4, 0, -3, 0, 330, 0],
    [2, -1, 2, 0, 327, 0],
    [0, 2, 1, 0, -323, 1165],
    [1, 1, -1, 0, 299, 0],
    [2, 0, 3, 0, 294, 0],
    [2, 0, -1, -2, 0, 8572],
];

const MOON_TABLE_2 = [
    [0, 0, 0, 1, 5128122],
    [0, 0, 1, 1, 280602],
    [0, 0, 1, -1, 277693],
    [2, 0, 0, -1, 173237],
    [2, 0, -1, 1, 55143],
    [2, 0, -1, -1, 46271],
    [2, 0, 0, 1, 32573],
    [0, 0, 2, 1, 17198],
    [2, 0, 1, -1, 9266],
    [0, 0, 2, -1, 8822],
    [2, -1, 0, -1, 8216],
    [2, 0, -2, -1, 4324],
    [2, 0, 1, 1, 4200],
    [2, 1, 0, -1, -3359],
    [2, -1, -1, 1, 2463],
    [2, -1, 0, 1, 2211],
    [2, -1, -1, -1, 2065],
    [0, 1, -1, -1, -1870],
    [4, 0, -1, -1, 1828],
    [0, 1, 0, 1, -1794],
    [0, 0, 0, 3, -1749],
    [0, 1, -1, 1, -1565],
    [1, 0, 0, 1, -1491],
    [0, 1, 1, 1, -1475],
    [0, 1, 1, -1, -1410],
    [0, 1, 0, -1, -1344],
    [1, 0, 0, -1, -1355],
    [0, 0, 3, 1, 1107],
    [4, 0, 0, -1, 1021],
    [4, 0, -1, 1, 833],
    [0, 0, 1, -3, 777],
    [4, 0, -2, 1, 671],
    [2, 0, 0, -3, 607],
    [2, 0, 2, -1, 596],
    [2, -1, 1, -1, 491],
    [2, 0, -2, 1, -451],
    [0, 0, 3, -1, 439],
    [2, 0, 2, 1, 422],
    [2, 0, -3, -1, 421],
    [2, 1, -1, 1, -366],
    [2, 1, 0, 1, -351],
    [4, 0, 0, 1, 331],
    [2, -1, 1, 1, 315],
    [2, -2, 0, -1, 302],
    [0, 0, 1, 3, -283],
    [2, 1, 1, -1, -229],
    [1, 1, 0, -1, 223],
    [1, 1, 0, 1, 223],
    [0, 1, -2, -1, -220],
    [2, 1, -1, -1, -220],
    [1, 0, 1, 1, -185],
    [2, -1, -2, -1, 181],
    [0, 1, 2, 1, -177],
    [4, 0, -2, -1, 176],
    [4, -1, -1, -1, 166],
    [1, 0, 1, -1, -164],
    [4, 0, 1, -1, 132],
    [1, 0, -1, -1, -119],
    [4, -1, 0, -1, 115],
    [2, -2, 0, 1, 107],
];


export class World {

    system: System;
    fs: FileSystem;
    objDir: Directory;
    rootSession: UserSession;
    tickInterval: number | null = null;

    time: number = 0;
    timeWarp: number = 1;
    
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
        let timeDiff = 1/this.config.tps * this.timeWarp;
        this.time += timeDiff;
        let T = (this.time/86400 - 10957.5) / 36525;
        for (let path of this.getObjPaths('', true)) {
            let obj = this.getObj(path);
            if (path === 'sun/earth/moon') {
                let Lp = normalizeAngle(218.3164591 + 481267.88134236*T - 0.0013268*T**2 + T**3/538841 - T**4/65194000);
                let D = normalizeAngle(297.8502402 + 445267.1115168*T - 0.0016300*T**2 + T**3/545868 - T**4/113065000);
                let M = normalizeAngle(357.5291092 + 35999.0502909*T - 0.0001536*T**2 + T**3/24490000);
                let Mp = normalizeAngle(134.9634114 + 477198.8676313*T + 0.0089970*T**2 + T**3/69699 - T**4/14712000);
                let F = normalizeAngle(93.2720997 + 483202.0175273*T - 0.0034029*T**2 - T**3/3526000 + T**4/863310000);
                let A1 = normalizeAngle(119.75 + 131.849*T);
                let A2 = normalizeAngle(53.09 + 479264.290*T);
                let A3 = normalizeAngle(313.45 + 481266.484*T);
                let S1 = 0;
                let Sr = 0;
                for (let field of MOON_TABLE_1) {
                    let x = D * field[0] + M * field[1] + Mp * field[2] + F * field[3];
                    S1 += field[4] * sin(x);
                    if (field[5] !== 0) {
                        Sr += field[5] * cos(x);
                    }
                }
                let Sb = 0;
                for (let field of MOON_TABLE_2) {
                    let x = D * field[0] + M * field[1] + Mp * field[2] + F * field[3];
                    Sb += field[4] * sin(x);
                }
                S1 += (3958*sin(A1) + 1962*sin(Lp - F) + 318*sin(A2));
                Sb += (-2235*sin(Lp) + 382*sin(A3) + 175*sin(A1 - F) + 175*sin(A1 + F) + 127*sin(Lp - Mp) - 115*sin(Lp + Mp));
                let l = (Lp + S1)/1000000;
                let b = Sb/1000000;
                let d = 385000560 + Sr;
                let x = d * sin(b) * cos(l);
                let y = d * sin(b) * sin(l);
                let z = d * cos(b);
                obj.position = [x, y, z];
            } else if (obj.orbit) {
                let parent = this.getObj(path.split('/').slice(0, -1).join('/'));
                let {at, sma, ecc, mna, inc, lan, aop} = obj.orbit;
                if (obj.orbit.aopPrecession) {
                    aop += obj.orbit.aopPrecession * (this.time - at)
                }
                if (path === 'sun/earth') {
                    ecc += 0.000042037 * cos(360 / 112000 * T * 100);
                    lan = normalizeAngle(lan + 0.323 * T);
                }
                let per = 2 * pi * sqrt(sma ** 3 / parent.mass / this.config.G);
                if (this.firstTickComplete) {
                    mna = normalizeAngle(mna + 360 / this.config.tps * this.timeWarp / per);
                } else {
                    mna = normalizeAngle(mna + 360 * (this.time - at) / per);
                }
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
                x += parent.position[0];
                y += parent.position[1];
                z += parent.position[2];
                obj.position = [x, z, y];
            }
            if (obj.offset) {
                if (!obj.orbit) {
                    obj.position = obj.offset;
                } else {
                    obj.position = [
                        obj.position[0] + obj.offset[0],
                        obj.position[1] + obj.offset[1],
                        obj.position[2] + obj.offset[2],
                    ];
                }
            }
            this.setObj(path, obj);
        }
        if (!this.firstTickComplete) {
            this.firstTickComplete = true;
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
