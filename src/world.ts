
import {timeDiff} from './util.ts';
import {type Cycle, type Obj, obj} from './obj.ts';
import {join, type BaseFile, type Directory, FileSystem} from './files.ts';
import {getPosition, getPeriod} from './orbits.ts';

interface Config {
    tps: number,
    c: number,
    G: number,
    lC: number,
    initialTarget: string,
}

const latin1Decoder = new TextDecoder('latin1');

class World extends FileSystem {

    timeWarp: number = 1;
    tickInterval: number | null = null;

    constructor(files: Directory | {[key: string]: BaseFile}) {
        super(files);
    }

    cycle(cycle: Cycle): number {
        if (Array.isArray(cycle)) {
            return cycle.map((c) => this.cycle(c)).reduce((x, y) => x + y);
        } else if (cycle === null) {
            return 0;
        } else if (typeof cycle === 'object' && 'type' in cycle) {
            if (cycle.type === 'fixed') {
                return cycle.value;
            } else if (cycle.type === 'linear') {
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
        let data: any | undefined = this.readjson(join('/home/objects', path, 'object'));
        if (data === undefined) return undefined;
        return obj(data.$type, data);
    }

    writeObj(path: string, object: Obj): void {
        this.writejson(join('/home/objects', path, 'object'), object);
    }

    isdirObj(path: string): boolean {
        return this.isdir(join('/home/objects', path));
    }

    lsObj(path: string): string[] {
        return this.ls(join('/home/objects', path)).map((x) => x.replace('object', '').replace(/\/$/, '')).filter((x) => x !== 'object' && x !== '');
    }

    lsObjAll(): string[] {
        let out: string[] = [];
        for (const path in this.files) {
            if (path.startsWith('/home/objects/') && path.endsWith('/object')) {
                out.push(path.slice('/home/objects/'.length, -'/object'.length));
            }
        }
        // for (const filepath of this.lsObj(path)) {
        //     const objpath = join(path, filepath).slice(1);
        //     out.push(objpath);
        //     if (this.isdirObj(objpath)) {
        //         out = [...out, ...this.lsObjAll(objpath)];
        //     }
        // }
        return out;
    }
    
    lsObjAllOrderedBySma(): string[] {
        const base = this.lsObjAll();
        const withObjs = base.map((x): [string, Obj | undefined] => [x, this.readObj(x)]);
        const filtered: [string, Obj][] = withObjs.filter((x): x is [string, Obj] => x[1] !== undefined);
        const sorted = filtered.sort(([x, a], [y, b]) => a.hasOrbit() ? (b.hasOrbit() ? a.orbit.sma - b.orbit.sma : 1) : (b.hasOrbit() ? -1 : 0));
        const out = sorted.map(([x, y]) => x);
        return out;
    }

    get config(): Config {
        return this.readjson('/etc/config');
    }

    get tps(): number {
        return this.config.tps;
    }

    get time(): Date | undefined {
        const out = this.read('/etc/time');
        if (out === undefined) {
            return undefined
        } else {
            return new Date(out);
        }
    }

    set time(value: Date) {
        this.write('/etc/time', value.toISOString());
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
                if (object.axis && object.axis.period === 'sync') {
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

    async export(): Promise<string> {
        const stream = new Blob([JSON.stringify(this)], {type: 'application/json'}).stream();
        const compStream = stream.pipeThrough(new CompressionStream('deflate'));
        const data = new Uint8Array(await (new Response(compStream)).arrayBuffer());
        if (this.lsObjAll().includes('sun')) console.log('exported', data);
        return 'space world file (format version 1)\n' + Array.from(data).map(x => String.fromCharCode(x)).join('');
    }

    static async import(data: string): Promise<World> {
        if (!data.startsWith('space world file (format version ')) {
            throw new TypeError('invalid world to import');
        }
        data = data.slice('space world file (format version '.length);
        const version = parseInt(data.slice(0, data.indexOf(')')));
        data = data.slice(data.indexOf('\n') + 1);
        if (version === 1) {
            console.log('importing', new Uint8Array([...data].map(char => char.charCodeAt(0))));
            const stream = new Blob([new Uint8Array([...data].map(char => char.charCodeAt(0)))]).stream();
            const decompStream = stream.pipeThrough(new DecompressionStream('deflate'));
            return World.fromJSON(await (new Response(decompStream)).text());
        } else {
            throw new TypeError('invalid world to import');
        }
    }

    static fromJSON(data: string): World {
        return new World(FileSystem.fromJSON(data).files);
    }

}

export {
    join,
    Config,
    World,
}
