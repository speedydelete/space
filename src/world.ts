
import type {Mesh} from 'three';
import type {Time, Obj, BaseFile, FileSystem} from './types.ts';
import {File, Value, Star, Planet, Directory, Link, Config, objectTypeMap} from './types.ts';
import {timeDiff} from './util.ts';

const pathSep = /(?<!\\)\//;

function join(...paths: string[]): string {
    let out: string[] = [];
    for (const path of paths) {
        for (const item of path.split(pathSep)) {
            if (item == '' || item == '.') {
                continue;
            } else if (item == '..') {
                out.pop();
            } else {
                out.push(item);
            }
        }
    }
    let path = out.filter((x) => x !== '').join('/');
    if (!path.startsWith('/')) path = '/' + path;
    return path;
}

class World {
    files: {[key: string]: BaseFile} = {};
    objectMeshes: {[key: string]: Mesh} = {}
    constructor(files: Directory) {
        this.setupFiles(files);
    }
    setupFiles(dir: Directory, basePath: string = '/'): void {
        for (const [path, file] of Object.entries(dir.files)) {
            const fullPath = join(basePath, path);
            if (file instanceof Directory) {
                this.files[fullPath] = new Directory({});
                this.setupFiles(file, fullPath);
            } else {
                this.files[fullPath] = file;
            }
        }
    }
    getFile(path: string): [string, BaseFile | undefined] {
        let file = this.files[path];
        while (file instanceof Link) {
            path = file.path;
            file = this.files[path];
        }
        return [path, file];
    }
    resolve(path: string): string {
        return this.getFile(path)[0];
    }
    read(path: string): string | undefined {
        let file = this.getFile(path)[1];
        if (file instanceof File) {
            return file.data;
        } else if (file instanceof Directory) {
            throw new TypeError(`cannot read directory ${path}`);
        }
    }
    write(path: string, value: string): void {
        const [resolvedPath, file] = this.getFile(path);
        if (file === undefined) {
            this.files[resolvedPath] = new File(value);
        } else if (this.files[resolvedPath] instanceof File) {
            this.files[resolvedPath].data = value;
        }
    }
    mkdir(path: string): void {
        const [resolvedPath, file] = this.getFile(path);
        if (file !== undefined) {
            throw new TypeError(`file '${path}' already exists`);
        } else {
            this.files[resolvedPath] = new Directory({});
        }
    }
    ls(path: string): string[] {
        const [resolvedPath, file] = this.getFile(path);
        if (file instanceof Directory) {
            let out: string[] = [];
            const length = resolvedPath.length;
            for (const filePath in this.files) {
                if (filePath.startsWith(resolvedPath) && filePath.length > length && !filePath.slice(length + 1).match(pathSep)) {
                    out.push(filePath.slice(length + 1));
                }
            }
            return out;
        } else if (file instanceof File) {
            throw new TypeError(`file '${path}' is not a directory`);
        } else if (file === undefined) {
            throw new TypeError(`directory '${path}' does not exist`);
        } else {
            return [];
        }
    }
    isdir(path: string): boolean {
        return this.getFile(path)[1] instanceof Directory;
    }
    readjson(path: string): any | undefined {
        const text = this.read(path);
        if (text === undefined) {
            return undefined;
        } else {
            return JSON.parse(text);
        }
    }
    writejson(path: string, value: any): void {
        this.write(path, JSON.stringify(value));
    }
    getobj(path: string): Obj | undefined {
        let data: any;
        data = this.readjson(join('/home/objects', path, '.object'));
        if (data === undefined) {
            data = this.readjson(join('/home/objects', path + '.object'));
            if (data === undefined) {
                return undefined;
            }
        }
        return new objectTypeMap[data.type](data);
    }
    setobj(path: string, object: Obj): void {
        if (this.read(join('/home/objects', path, '.object')) !== undefined) {
            this.writejson(join('/home/objects', path, '.object'), object);
        } else {
            this.writejson(join('/home/objects', path + '.object'), object);
        }
    }
    isdirobj(path: string): boolean {
        return this.isdir(join('/home/objects', path));
    }
    lsobj(path: string): string[] {
        return this.ls(join('/home/objects', path)).map((x) => x.replace('.object', '').replace(/\/$/, '')).filter((x) => x != '.object' && x !== '');
    }
    lsobjall(path: string = ''): string[] {
        let out: string[] = [];
        for (const filepath of this.lsobj(path)) {
            const objpath = join(path, filepath).slice(1);
            out.push(objpath);
            if (this.isdirobj(objpath)) {
                out = [...out, ...this.lsobjall(objpath)];
            }
        }
        return out;
    }
    setObjectMesh(path: string, mesh: Mesh) {
        this.objectMeshes[path] = mesh;
    }
    getObjectMesh(path: string): Mesh | undefined {
        if (path.startsWith('/')) path = path.slice(1);
        return this.objectMeshes[path];
    }
    get config(): Config {
        return this.readjson('/etc/config');
    }
    get time(): Date | undefined {
        const out = this.read('/etc/time');
        if (out) {
            return new Date(out);
        } else {
            return undefined;
        }
    }
    set time(value: Date) {
        this.write('/etc/time', value.toISOString());
    }
}

const defaultWorld = new World(new Directory({
    bin: new Directory(),
    boot: new Directory(),
    dev: new Directory(),
    etc: new Directory({
        config: new File({
            G: 6.6743e-11,
            c: 299792458,
            lC: 3.2065e+30,
        }),
        time: new File((new Date()).toISOString()),
    }),
    home: new Directory({
        root: new Link('/root/'),
        objects: new Directory({
            sun: new Directory({
                '.object': new File(new Star({
                    name: 'Sun',
                    mass: 1.9985e30,
                    texture: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Solarsystemscope_texture_2k_sun.jpg/800px-Solarsystemscope_texture_2k_sun.jpg',
                    magnitude: 4.83,
                    radius: 695700000,
                    flattening: 0.00005,
                    rotation: {
                        type: 'linear',
                        min: 0,
                        max: 360,
                        period: 2164320,
                        epoch: new Date(2023, 1, 1, 9, 10),
                    },
                    position: [0, 0, 0],
                    spectralType: 'G2V',
                })),
                earth: new Directory({
                    '.object': new File(new Planet({
                        name: 'Earth',
                        mass: 5.972168e24,
                        radius: 6378127,
                        flattening: 0.003352810681182319,
                        rotation: {
                            type: 'linear',
                            min: 0,
                            max: 360,
                            period: 86164.100352,
                            epoch: new Date(2024, 3, 20, 3, 7),
                        },
                        tilt: 23.4392811,
                        orbit: {
                            ap: 152097597000,
                            pe: 147098450000,
                            sma: 149598023000,
                            ecc: 0.0167086,
                            period: 31558149.7635,
                            inc: 7.155,
                            lan: -11.26064,
                            aop: 114.20783,
                            top: '2023-1-4'
                        },
                        texture: 'https://i.ibb.co/F7Wgjj1/2k-earth-daymap.jpg',
                    })),
                    'moon.object': new File(new Planet({
                        name: 'Moon',
                        mass: 7.346e22,
                        radius: 1738100,
                        flattening: 0.0012,
                        rotation: {
                            type: 'linear',
                            min: 0,
                            max: 360,
                            period: 2360591.5104,
                            epoch: new Date(2024, 12, 1, 1, 21),
                        },
                        orbit: {
                            ap: 405400000,
                            pe: 362600000,
                            sma: 384399000,
                            ecc: 0.0549,
                            period: 2360591.5104,
                            inc: 5.145,
                            lan: 0,
                            aop: 0,
                            top: new Date(2024, 11, 14, 11, 18),
                        },
                        texture: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/lroc_color_poles_1k.jpg',
                    })),
                }),
            }),
        }),
    }),
    lib: new Directory(),
    media: new Directory(),
    mnt: new Directory(),
    opt: new Directory(),
    proc: new Directory(),
    root: new Directory(),
    sbin: new Directory(),
    srv: new Directory(),
    sys: new Directory(),
    tmp: new Directory(),
    usr: new Directory({
        bin: new Link('/bin'),
        include: new Directory(),
        lib: new Directory(),
        libexec: new Directory(),
        local: new Directory(),
        sbin: new Link('/sbin'),
        share: new Directory(),
        src: new Directory(),
    }),
    var: new Directory({
        cache: new Directory(),
        lib: new Directory(),
        lock: new Directory(),
        log: new Directory(),
        mail: new Directory(),
        opt: new Directory(),
        run: new Directory(),
        spool: new Directory(),
        tmp: new Directory(),
    }),
}));

function resolveValue(value: Value, world: World): number {
    if (Array.isArray(value)) {
        return value.map((c) => resolveValue(c, world)).reduce((x, y) => x + y);
    } else if (value === null) {
        return value;
    } else if (typeof value == 'object' && 'type' in value) {
        if (value.type == 'fixed') {
            return resolveValue(value.value, world);
        } else if (value.type == 'linear') {
            return resolveValue(value.min, world) + timeDiff(world.time, value.epoch)/resolveValue(value.period, world) * resolveValue(value.max, world);
        } else {
            throw new TypeError('Unrecognized value type');
        }
    } else {
        return value;
    }
}

export {
    join,
    World,
    defaultWorld,
    resolveValue,
}
