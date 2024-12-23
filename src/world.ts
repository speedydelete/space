
import {timeDiff} from './util';
import {type Cycle, type Position, type Obj, obj} from './obj';
import {join, type Directory, FileSystem} from './files';
import {getPosition, getPeriod} from './orbits';

interface Config {
    tps: number,
    c: number,
    G: number,
    lC: number,
    initialTarget: string,
}

class World {

    fs: FileSystem;
    timeWarp: number = 1;
    tps: number;

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
        let data: any | undefined = this.fs.readjson(join('/home/objects', path, 'object'));
        if (data === undefined) return undefined;
        return obj(data.$type, data);
    }

    writeObj(path: string, object: Obj): void {
        this.fs.writejson(join('/home/objects', path, 'object'), object);
    }

    isdirObj(path: string): boolean {
        return this.fs.isdir(join('/home/objects', path));
    }

    lsObj(path: string): string[] {
        return this.fs.ls(join('/home/objects', path)).map((x) => x.replace('object', '').replace(/\/$/, '')).filter((x) => x != 'object' && x !== '');
    }

    lsObjAll(path: string = ''): string[] {
        let out: string[] = [''];
        for (const filepath of this.lsObj(path)) {
            const objpath = join(path, filepath).slice(1);
            out.push(objpath);
            if (this.isdirObj(objpath)) {
                out = [...out, ...this.lsObjAll(objpath)];
            }
        }
        return out;
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

    updateObjects(basePath: string = '', parent: Obj | null = null): void {
        for (const filename of this.lsObj(basePath)) {
            const path = join(basePath, filename);
            const object = this.readObj(path);
            if (object !== undefined) {
                let [z, x, y] = getPosition(this, object, parent);
                if (parent) {
                    x += parent.position[0];
                    y += parent.position[1];
                    z += parent.position[2];
                }
                object.position = [x, y, z];
                this.writeObj(path, object);
                if (this.isdirObj(path)) {
                    this.updateObjects(path, object);
                }
            }
        }
    }

    init(): void {
        if (this.time === undefined) {
            this.time = new Date();
        }
        for (const path of this.lsObjAll()) {
            const object = this.readObj(path)
            if (object === undefined) continue;
            if (object.hasOrbit()) {
                const parent = this.readObj(join(path, '..'));
                if (parent === undefined) {
                    console.error('undefined parent for', object, 'path:', path, 'parent path:', join(path, '..'));
                    continue;
                }
                if (object.orbit.at) {
                    const at = new Date(object.orbit.at);
                    const diff = (this.time.getTime() - at.getTime())/1000;
                    if (object.orbit.mna) {
                        const degDiff = diff/getPeriod(this.config.G, object, parent) * 360;
                        object.orbit.mna += degDiff;
                        object.orbit.mna %= 360;
                    }
                }
                if (object.axis && object.axis.period == 'sync') {
                    object.axis.period = getPeriod(this.config.G, object, parent);
                }
            }
            if (object.axis && object.axis.epoch === null) {
                object.axis.epoch = this.time;
            }
            this.writeObj(path, object);
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
    join,
    Config,
    World,
}
