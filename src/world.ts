
import type {Mesh} from 'three';
import type {Time, Object_, BaseFile, FileSystem} from './types.ts';
import {File, Value, Star, Planet, Directory, Link, Config, objectTypeMap} from './types.ts';
import {timeDiff} from './util.ts';

const pathSep = /(?<!\\)\//;

class World {
    files: FileSystem;
    rootDirectory: Directory<FileSystem>;
    dir: string;
    objectMeshes: {[key: string]: Mesh} = {};
    constructor(files: FileSystem) {
        this.files = files;
        this.rootDirectory = new Directory(files);
        this.dir = '/';
    }
    join(...paths: string[]): string {
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
    resolve(...paths: string[]): string {
        let path = this.join(...paths);
        if (!path.startsWith('/')) {
            path = this.join(this.dir, path);
        }
        return path;
    }
    cd(path: string): void {
        this.dir = this.join(this.dir, path);
    }
    read(path: string): File | undefined {
        const paths = this.resolve(path).split(pathSep);
        let out: Directory[] = [this.rootDirectory];
        let i = 0;
        for (const item of paths) {
            if (item === '' || item == '.') {
            } else if (item == '..') {
                if (out.length > 0) {
                    out.pop();
                } else {
                    throw new TypeError(`directory '/' has no higher level directory`);
                }
            } else {
                const file = out[out.length - 1].files[item];
                if (file === undefined) {
                    throw new TypeError(`nonexistent file '${paths.slice(0, i + 1).join('/')}'`);
                } else if (file instanceof File) {
                    if (i == paths.length - 1) {
                        return file;
                    } else {
                        throw new TypeError(`regular file '${paths.slice(0, i + 1).join('/')}' is not a directory`);
                    }
                } else if (file instanceof Link) {
                    return this.read(this.join(file.path, ...paths.slice(i + 1)));
                } else if (file instanceof Directory) {
                    out.push(file);
                }
            }
            i++;
        }
    }
    readJSON(path: string): any {
        const data = this.read(path);
        return data !== undefined ? JSON.parse(data.data) : data;
    }
    write(path: string, data: string): void {
        const paths = this.resolve(path).split(pathSep);
        let out: Directory[] = [this.rootDirectory];
        let i = 0;
        for (const item of paths) {
            if (item === '' || item == '.') {
            } else if (item == '..') {
                if (out.length > 0) {
                    out.pop();
                } else {
                    throw new TypeError(`directory '/' has no higher level directory`);
                }
            } else {
                const file = out[out.length - 1].files[item];
                if (file === undefined) {
                    if (i === paths.length - 1) {
                        out[out.length - 1].files[item] = new File(data);
                    } else {
                        throw new TypeError(`nonexistent file '${paths.slice(0, i + 1).join('/')}'`);
                    }
                } else if (file instanceof File) {
                    if (i === paths.length - 1) {
                        file.data = data;
                    } else {
                        throw new TypeError(`regular file '${paths.slice(0, i + 1).join('/')}' is not a directory`);
                    }
                } else if (file instanceof Link) {
                    return this.write(this.join(file.path, ...paths.slice(i + 1)), data);
                } else if (file instanceof Directory) {
                    out.push(file);
                }
            }
            i++;
        }
    }
    writeJSON(path: string, data: any): void {
        this.write(path, JSON.stringify(data));
    }
    mkdir<T extends {[key: string]: BaseFile} | BaseFile = {[key: string]: BaseFile}>(path: string): void {
        const paths = this.resolve(path).split(pathSep);
        let out: Directory[] = [this.rootDirectory];
        let i = 0;
        for (const item of paths) {
            if (item === '' || item == '.') {
            } else if (item == '..') {
                if (out.length > 0) {
                    out.pop();
                } else {
                    throw new TypeError(`directory '/' has no higher level directory`);
                }
            } else {
                const file = out[out.length - 1].files[item];
                if (file === undefined) {
                    if (i === paths.length - 1) {
                        out[out.length - 1].files[item] = new Directory<T>();
                    } else {
                        throw new TypeError(`nonexistent file '${paths.slice(0, i + 1).join('/')}'`);
                    }
                } else if (file instanceof File) {
                    throw new TypeError(`regular file '${paths.slice(0, i + 1).join('/')}' is not a directory`);
                } else if (file instanceof Link) {
                    this.mkdir(this.join(file.path, ...paths.slice(i + 1)));
                } else if (file instanceof Directory) {
                    out.push(file);
                }
            }
            i++;
        }
    }
    rm(path: string): void {
        const paths = this.resolve(path).split(pathSep);
        let out: Directory[] = [this.rootDirectory];
        let i = 0;
        for (const item of paths) {
            if (item === '' || item == '.') {
            } else if (item == '..') {
                if (out.length > 0) {
                    out.pop();
                } else {
                    throw new TypeError(`directory '/' has no higher level directory`);
                }
            } else {
                const file = out[out.length - 1].files[item];
                if (file === undefined) {
                    throw new TypeError(`nonexistent file '${paths.slice(0, i + 1).join('/')}'`);
                } else if (file instanceof File) {
                    if (i === paths.length - 1) {
                        delete out[out.length - 1].files[item];
                    } else {
                        throw new TypeError(`regular file '${paths.slice(0, i + 1).join('/')}' is not a directory`);
                    }
                } else if (file instanceof Link) {
                    this.rm(this.join(file.path, ...paths.slice(i + 1)));
                } else if (file instanceof Directory) {
                    out.push(file);
                }
            }
            i++;
        }
    }
    ls(path: string): string[] {
        const paths: string[] = this.resolve(path).split(pathSep);
        let out: Directory[] = [this.rootDirectory];
        for (let i = 0; i < paths.length; i++) {
            const item: string = paths[i];
            if (item === '' || item == '.') {
            } else if (item == '..') {
                if (out.length > 0) {
                    out.pop();
                } else {
                    throw new TypeError(`directory '/' has no higher level directory`);
                }
            } else {
                const file = out[out.length - 1].files[item];
                if (file === undefined) {
                    throw new TypeError(`nonexistent file '${paths.slice(0, i + 1 + 1).join('/')}'`);
                } else if (file instanceof File) {
                    throw new TypeError(`regular file '${paths.slice(0, i + 1 + 1).join('/')}' is not a directory`);
                } else if (file instanceof Link) {
                    return this.ls(this.join(file.path, ...paths.slice(i + 1 + 1)));
                } else if (file instanceof Directory) {
                    if (i === paths.length - 1) {
                        return Object.keys(file.files);
                    } else {
                        out.push(file);
                    }
                }
            }
        }
        return [];
    }
    isDir(path: string): boolean {
        const paths = this.resolve(path).split(pathSep);
        let out: Directory[] = [this.rootDirectory];
        let i = 0;
        for (const item of paths) {
            if (item === '' || item == '.') {
            } else if (item == '..') {
                if (out.length > 0) {
                    out.pop();
                } else {
                    throw new TypeError(`directory '/' has no higher level directory`);
                }
            } else {
                const file = out[out.length - 1].files[item];
                if (file === undefined) {
                    throw new TypeError(`nonexistent file '${paths.slice(0, i + 1).join('/')}'`);
                } else if (file instanceof File) {
                    if (i === paths.length - 1) {
                        return false;
                    } else {
                        throw new TypeError(`regular file '${paths.slice(0, i + 1).join('/')}' is not a directory`);
                    }
                } else if (file instanceof Link) {
                    return this.isDir(this.join(file.path, ...paths.slice(i + 1)));
                } else if (file instanceof Directory) {
                    if (i === paths.length - 1) {
                        return true;
                    } else {
                        out.push(file);
                    }
                }
            }
            i++;
        }
        return false;
    }
    get config(): Config {
        return this.readJSON('/etc/config');
    }
    get time(): Date | undefined {
        const out = this.read('/etc/time');
        if (out) {
            return new Date(out.data);
        } else {
            return undefined;
        }
    }
    set time(value: Date) {
        this.write('/etc/time', value.toISOString());
    }
    getobj(path: string): Object_ | undefined {
        const data = this.readJSON(this.join('/home/objects', path + '.object'));
        if (data === undefined) {
            return undefined;
        } else {
            return new objectTypeMap[data.type](data);
        }
    }
    setobj(path: string, object: Object_): void {
        this.writeJSON(this.join('/home/objects', path + '.object'), object);
    }
    lsobj(path: string = '/'): string[] {
        return this.ls(this.join('/home/objects', path));
    }
    lsobjall(path = ''): string[] {
        let out: string[] = [];
        for (const filename of this.lsobj(path)) {
            const filepath = this.join(path, filename);
            if (this.isDir(this.join('/home/objects', filepath))) {
                out = out.concat(this.lsobjall(filepath));
            } else {
                out.push(filepath.replace(/\.object$/, '').replace(/^\//, ''));
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
}

const defaultWorld = new World({
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
            'sun.object': new File(new Star({
                name: 'Sun',
                mass: 1.9985e30,
                texture: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Solarsystemscope_texture_2k_sun.jpg/800px-Solarsystemscope_texture_2k_sun.jpg',
                magnitude: 4.83,
                radius: 695700000,
                flattening: 0.00005,
                rotation: {
                    type: 'linear',
                    min: 0,
                    max: Math.PI*2,
                    period: 2164320,
                    epoch: new Date(2023, 1, 1, 9, 10),
                },
                position: [0, 0, 0],
                spectralType: 'G2V',
            })),
            sun: new Directory({
                'earth.object': new File(new Planet({
                    name: 'Earth',
                    mass: 5.972168e24,
                    radius: 6378127,
                    flattening: 0.003352810681182319,
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
                earth: new Directory({
                    'moon.object': new File(new Planet({
                        name: 'Moon',
                        mass: 7.346e22,
                        radius: 1738100,
                        flattening: 0.0012,
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
});

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
    World,
    defaultWorld,
    resolveValue,
}
