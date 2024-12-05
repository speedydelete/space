
import type {FileSystem} from './types.ts';
import {Directory, Link} from './types.ts';
import {type} from './util.ts';

const pathSep = /(?<!\\)\/(?=([^"\\]*(\\.|"([^"\\]*\\.)*[^"\\]*"))*[^"]*$)/;

class World {
    constructor(files: FileSystem): void {
        this.files = files;
        this.dir = '/';
    }
    join(...paths: string[]): string {
        let out = [];
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
    resolve(...paths: string[]): void {
        let path = this.join(...paths);
        if (!path.startsWith('/')) {
            path = this.join(this.dir, path);
        }
        return path;
    }
    cd(path: string): void {
        this.dir = this.join(this.dir, path);
    }
    read(path: string): File {
        path = this.resolve(path).split(pathSep);
        let out: Directory[] = [this.files];
        let i = 0;
        for (const item of path) {
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
                    throw new TypeError(`nonexistent file ${path.slice(0, i)}`);
                } else if (file instanceof File) {
                    if (i == path.length - 1) {
                        return file.data;
                    } else {
                        throw new TypeError(`regular file ${path.slice(0, i)} is not a directory`);
                    }
                } else if (file instanceof Link) {
                    return this.read(this.join(file, path.slice(i)));
                }
                out.push(file);
            }
            i++;
        }
    }
    readJSON(path: string): any {
        return JSON.parse(this.read(path));
    }
    write(path: string, data: string): void {
        path = this.resolve(path).split(pathSep);
        let out: Directory[] = [this.files];
        let i = 0;
        for (const item of path) {
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
                    if (i === path.length - 1) {
                        out[out.length - 1].files[item] = new File(data);
                    } else {
                        throw new TypeError(`nonexistent file ${path.slice(0, i)}`);
                    }
                } else if (file instanceof File) {
                    if (i === path.length - 1) {
                        file.data = data;
                    } else {
                        throw new TypeError(`regular file ${path.slice(0, i)} is not a directory`);
                    }
                } else if (file instanceof Link) {
                    return this.write(this.join(file, path.slice(i)), data);
                }
                out.push(file);
            }
            i++;
        }
    }
    writeJSON(path: string, data: any): void {
        this.write(path, JSON.stringify(data));
    }
    mkdir<T extends {[key: string]: BaseFile} | BaseFile = {key: string: BaseFile}>(path: string): void {
        path = this.resolve(path).split(pathSep);
        let out: Directory[] = [this.files];
        let i = 0;
        for (const item of path) {
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
                    if (i === path.length - 1) {
                        out[out.length - 1].files[item] = new Directory<T>();
                    } else {
                        throw new TypeError(`nonexistent file ${path.slice(0, i)}`);
                    }
                } else if (file instanceof File) {
                    throw new TypeError(`regular file ${path.slice(0, i)} is not a directory`);
                } else if (file instanceof Link) {
                    return this.mkdir(this.join(file, path.slice(i)));
                }
                out.push(file);
            }
            i++;
        }
    }
    rm(path: string): void {
        path = this.resolve(path).split(pathSep);
        let out: Directory[] = [this.files];
        let i = 0;
        for (const item of path) {
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
                    throw new TypeError(`nonexistent file ${path.slice(0, i)}`);
                } else if (file instanceof File) {
                    if (i === path.length - 1) {
                        delete out[out.length - 1].files[item];
                    } else {
                        throw new TypeError(`regular file ${path.slice(0, i)} is not a directory`);
                    }
                } else if (file instanceof Link) {
                    return this.write(this.join(file, path.slice(i)), data);
                }
                out.push(file);
            }
            i++;
        }
    }
    ls(path: string): string[] {
        path = this.resolve(path).split(pathSep);
        let out: Directory[] = [this.files];
        let i = 0;
        for (const item of path) {
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
                    throw new TypeError(`nonexistent file ${path.slice(0, i)}`);
                } else if (file instanceof File) {
                    throw new TypeError(`regular file ${path.slice(0, i)} is not a directory`);
                } else if (file instanceof Link) {
                    return this.ls(this.join(file, path.slice(i)));
                } else if (i === path.length - 1) {
                    return Object.keys(file.files);
                }
                out.push(file);
            }
            i++;
        }
    }
    isDir(path: string): string {
        path = this.resolve(path).split(pathSep);
        let out: Directory[] = [this.files];
        let i = 0;
        for (const item of path) {
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
                    throw new TypeError(`nonexistent file ${path.slice(0, i)}`);
                } else if (file instanceof File) {
                    if (i === path.length - 1) {
                        return false;
                    } else {
                        throw new TypeError(`regular file ${path.slice(0, i)} is not a directory`);
                    }
                } else if (file instanceof Link) {
                    return this.read(this.join(file, path.slice(i)));
                } else if (i === path.length - 1) {
                    return true;
                }
                out.push(file);
            }
            i++;
        }
    }
    get config(): Config {
        return this.readJSON('/etc/config.json');
    }
    object(path: string): Object {
        return this.read(this.join('/home/objects', path + '.object'));
    }
}

const defaultWorld = new World({
    bin: new Directory();
    boot: new Directory();
    dev: new Directory();
    etc: new Directory({
        'config.json': new File(`{
            "G": 6.6743e-11,
            "c": 299792458,
            "lC": 3.2065e+30,
        }`),
    });
    home: new Directory({
        root: new Link('/root/'),
        objects: new Directory(),
    });
    lib: new Directory();
    media: new Directory();
    mnt: new Directory();
    opt: new Directory();
    proc: new Directory();
    root: new Directory();
    sbin: new Directory();
    srv: new Directory();
    sys: new Directory();
    tmp: new Directory();
    usr: Directory<{
        bin: Link<'/bin'>;
        include: Directory;
        lib: Directory;
        libexec: Directory;
        local: Directory;
        sbin: Link<'/sbin'>;
        share: Directory;
        src: Directory;
    }>,
    var: Directory<{
        cache: Directory;
        lib: Directory;
        lock: Directory;
        log: Directory;
        mail: Directory;
        opt: Directory;
        run: Directory;
        spool: Directory;
        tmp: Directory;
    }>
});

export {
    World,
    defaultWorld,
}
