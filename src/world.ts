
import type {Time, BaseFile, Value, FileSystem} from './types.ts';
import {File, Directory, Link, Config} from './types.ts';
import {timeDiff} from './util.ts';

const pathSep = /(?<!\\)\/(?=([^"\\]*(\\.|"([^"\\]*\\.)*[^"\\]*"))*[^"]*$)/;

class World {
    files: FileSystem;
    rootDirectory: Directory<FileSystem>;
    dir: string;
    constructor(files: FileSystem) {
        this.files = files;
        this.rootDirectory = new Directory(files);
        this.dir = '/';
    }
    join(...paths: string[]): string {
        let out: string[] = [];
        if (paths.length > 0 && paths[0].startsWith('/')) out.push('/');
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
        return out.filter((x) => x !== '').join('/');
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
                    throw new TypeError(`nonexistent file ${paths.slice(0, i)}`);
                } else if (file instanceof File) {
                    if (i == paths.length - 1) {
                        return file;
                    } else {
                        throw new TypeError(`regular file ${paths.slice(0, i)} is not a directory`);
                    }
                } else if (file instanceof Link) {
                    return this.read(this.join(file.path, ...paths.slice(i)));
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
                        throw new TypeError(`nonexistent file ${paths.slice(0, i)}`);
                    }
                } else if (file instanceof File) {
                    if (i === paths.length - 1) {
                        file.data = data;
                    } else {
                        throw new TypeError(`regular file ${paths.slice(0, i)} is not a directory`);
                    }
                } else if (file instanceof Link) {
                    return this.write(this.join(file.path, ...paths.slice(i)), data);
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
                        throw new TypeError(`nonexistent file ${paths.slice(0, i)}`);
                    }
                } else if (file instanceof File) {
                    throw new TypeError(`regular file ${paths.slice(0, i)} is not a directory`);
                } else if (file instanceof Link) {
                    this.mkdir(this.join(file.path, ...paths.slice(i)));
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
                    throw new TypeError(`nonexistent file ${paths.slice(0, i)}`);
                } else if (file instanceof File) {
                    if (i === path.length - 1) {
                        delete out[out.length - 1].files[item];
                    } else {
                        throw new TypeError(`regular file ${paths.slice(0, i)} is not a directory`);
                    }
                } else if (file instanceof Link) {
                    this.rm(this.join(file.path, ...paths.slice(i)));
                } else if (file instanceof Directory) {
                    out.push(file);
                }
            }
            i++;
        }
    }
    ls(path: string): string[] {
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
                    throw new TypeError(`nonexistent file ${paths.slice(0, i)}`);
                } else if (file instanceof File) {
                    throw new TypeError(`regular file ${paths.slice(0, i)} is not a directory`);
                } else if (file instanceof Link) {
                    return this.ls(this.join(file.path, ...paths.slice(i)));
                } else if (file instanceof Directory) {
                    if (i === path.length - 1) {
                        return Object.keys(file.files);
                    } else {
                        out.push(file);
                    }
                }
            }
            i++;
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
                    throw new TypeError(`nonexistent file ${paths.slice(0, i)}`);
                } else if (file instanceof File) {
                    if (i === paths.length - 1) {
                        return false;
                    } else {
                        throw new TypeError(`regular file ${paths.slice(0, i)} is not a directory`);
                    }
                } else if (file instanceof Link) {
                    return this.isDir(this.join(file.path, ...paths.slice(i)));
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
    get time(): Time {
        return this.readJSON('/etc/time');
    }
    object(path: string): Object | undefined {
        const data = this.readJSON(this.join('/home/objects', path + '.object'));
        if (data === undefined) {
            return undefined;
        } else {
            return data.data;
        }
    }
    _allObjects(path: string = '/home/objects/'): {[key: string]: Object} {
        let out = {};
        for (const filename of this.ls(path)) {
            const filepath = this.join(path, filename);
            if (this.isDir(filepath)) {
                out = {...out, ...this._allObjects(filepath)};
            } else {
                out[filepath.slice('/home/objects/'.length)] = this.readJSON(path);
            }
        }
        return out;
    }
    get allObjects(): {[key: string]: Object} {
        return this._allObjects();
    }
}

const defaultWorld = new World({
    bin: new Directory(),
    boot: new Directory(),
    dev: new Directory(),
    etc: new Directory({
        'config': new File(`{
            "G": 6.6743e-11,
            "c": 299792458,
            "lC": 3.2065e+30
        }`),
    }),
    home: new Directory({
        root: new Link('/root/'),
        objects: new Directory(),
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
