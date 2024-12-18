
import type {Mesh} from 'three';
import {timeDiff} from './util';
import {type Cycle, type Position, type Obj, obj} from './obj';
import {join, type Directory, FileSystem} from './files';
import {getPosition} from './orbits';

const unitSize = 150000000000;

interface Config {
    tps: number,
    c: number,
    G: number,
    lC: number,
}

class World {

    fs: FileSystem;
    timeWarp: number = 1;
    tps: number;
    objMeshes: {[key: string]: Mesh} = {};

    tickInterval: number | null = null;

    constructor(files: Directory) {
        this.fs = new FileSystem(files);
        this.tps = this.config.tps;
    }

    cycle(cycle: Cycle): number {
        if (Array.isArray(cycle)) {
            return cycle.map((c) => this.cycle(c)).reduce((x, y) => x + y);
        } else if (cycle === null) {
            return 0;
        } else if (typeof cycle == 'object' && 'type' in cycle) {
            if (cycle.type == 'fixed') {
                return cycle.value;
            } else if (cycle.type == 'linear') {
                return this.cycle(cycle.min) + timeDiff(this.time, cycle.epoch)/this.cycle(cycle.period) * this.cycle(cycle.max);
            } else {
                // @ts-ignore
                throw new TypeError(`unrecognized cycle type '${cycle.type}`);
            }
        } else {
            return cycle;
        }
    }

    readObj(path: string): Obj | undefined {
        let data: any;
        data = this.fs.readjson(join('/home/objects', path, '.object'));
        if (data === undefined) {
            data = this.fs.readjson(join('/home/objects', path + '.object'));
            if (data === undefined) {
                return undefined;
            }
        }
        return obj(data.type, data);
    }

    writeObj(path: string, object: Obj): void {
        if (this.fs.read(join('/home/objects', path, '.object')) !== undefined) {
            this.fs.writejson(join('/home/objects', path, '.object'), object);
        } else {
            this.fs.writejson(join('/home/objects', path + '.object'), object);
        }
    }

    isdirObj(path: string): boolean {
        return this.fs.isdir(join('/home/objects', path));
    }

    lsObj(path: string): string[] {
        return this.fs.ls(join('/home/objects', path)).map((x) => x.replace('.object', '').replace(/\/$/, '')).filter((x) => x != '.object' && x !== '');
    }

    lsObjAll(path: string = ''): string[] {
        let out: string[] = [];
        for (const filepath of this.lsObj(path)) {
            const objpath = join(path, filepath).slice(1);
            out.push(objpath);
            if (this.isdirObj(objpath)) {
                out = [...out, ...this.lsObjAll(objpath)];
            }
        }
        return out;
    }

    getObjectMesh(path: string): Mesh | undefined {
        if (path.startsWith('/')) path = path.slice(1);
        return this.objMeshes[path];
    }

    setObjectMesh(path: string, mesh: Mesh) {
        this.objMeshes[path] = mesh;
    }

    get config(): Config {
        return this.fs.readjson('/etc/config');
    }

    get time(): Date | undefined {
        const out = this.fs.read('/etc/time');
        if (out === undefined) {
            return undefined
        } else {
            return new Date(out);
        }
    }

    set time(value: Date) {
        this.fs.write('/etc/time', value.toISOString());
    }

    updateObjects(basePath: string = '', parentPos: Position = [0, 0, 0]): void {
        for (const filename of this.lsObj(basePath)) {
            const path = join(basePath, filename);
            const object = this.readObj(path);
            const mesh = this.getObjectMesh(path);
            if (object !== undefined && mesh !== undefined) {
                let [z, x, y] = getPosition(this, object);
                x += parentPos[0];
                y += parentPos[1];
                z += parentPos[2];
                mesh.position.set(x/unitSize, y/unitSize, z/unitSize);
                mesh.rotation.set(0, 0, 0);
                mesh.rotateX(object.tilt * Math.PI / 180);
                mesh.rotateY(this.cycle(object.rotation) * Math.PI / 180);
                if (this.isdirObj(path)) {
                    this.updateObjects(path, [x, y, z]);
                }
            }
        }
    }

    tick(): void {
        if (this.time !== undefined) {
            this.time = new Date(this.time.getTime() + 1000 * this.timeWarp / this.tps);
        }
        this.updateObjects();
    }

    start(): void {
        this.tickInterval = window.setInterval(this.tick.bind(this), 1000/this.tps);
    }

    stop(): void {
        if (this.tickInterval !== null) window.clearInterval(this.tickInterval);
        this.tickInterval = null;
    }

}

export {
    World,
}
