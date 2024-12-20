
import {type ObjType, type Obj, type ObjParamsMap, obj} from './obj';

const pathSep = /(?<!\\)\//;

function split(path: string): string[] {
    return path.split(pathSep);
}

function join(...paths: string[]): string {
    let out: string[] = [];
    for (const path of paths) {
        for (const item of split(path)) {
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

type FileType = 'regular' | 'directory' | 'link';

class BaseFile {

    type: FileType;

    constructor(type: FileType) {
        this.type = type;
    }

}

class File extends BaseFile {

    data: string;

    constructor(data: string | Obj | any) {
        super('regular');
        if (typeof data == 'string') {
            this.data = data;
        } else {
            this.data = JSON.stringify(data);
        }
    }

}

class Directory<T extends {[key: string]: BaseFile} | BaseFile = {[key: string]: BaseFile}> extends BaseFile {

    files: {[key: string]: BaseFile};

    constructor(files: (T extends {[key: string]: BaseFile} ? T : {[key: string]: T}) | {} = {}) {
        super('directory');
        this.files = files;
    }

}

class Link<T extends string = string> extends BaseFile {

    path: string;

    constructor(path: T) {
        super('link');
        this.path = path;
    }

}

class FileSystem {

    files: {[key: string]: BaseFile} = {};

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
            const splitPath = split(resolvedPath);
            for (let i = 0; i < splitPath.length; i++) {
                const dir = splitPath.slice(0, i).join('/');
                if (!this.exists(dir)) this.mkdir(dir);
            }
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

    exists(path: string): boolean {
        return this.getFile(path)[1] !== undefined;
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

}

function file(data: string | Obj | any): File {
    return new File(data);
}

function directory(files: {[key: string]: BaseFile} = {}): Directory {
    return new Directory(files);
}

function link<T extends string = string>(path: T): Link {
    return new Link(path);
}

function objfile<T extends ObjType>(type: T, params: ObjParamsMap[T]): File {
    return new File(obj(type, params));
}

export {
    split,
    join,
    FileType,
    BaseFile,
    File,
    Directory,
    Link,
    FileSystem,
    file,
    directory,
    link,
    objfile,
}
