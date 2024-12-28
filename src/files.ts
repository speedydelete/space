
const pathSep = /(?<!\\)\//;

function split(path: string): string[] {
    return path.split(pathSep);
}

function join(...paths: string[]): string {
    let out: string[] = [];
    for (const path of paths) {
        for (const item of split(path)) {
            if (item === '' || item === '.') {
                continue;
            } else if (item === '..') {
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

    _json: boolean = false;
    _data: any;

    constructor(data: any, json: boolean = false) {
        super('regular');
        if (json) {
            this.jsonData = data;
        } else {
            this.data = data;
        }
    }

    get data(): string {
        if (this._json) {
            return JSON.stringify(this._data);
        } else {
            return this._data;
        }
    }

    get jsonData(): any {
        if (this._json) {
            return this._data;
        } else {
            return JSON.parse(this._data);
        }
    }

    set data(value: string) {
        this._data = value;
        this._json = false;
    }

    set jsonData(value: any) {
        this.data = value;
        this._json = true;
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
        this.setDirectory('/', files);
    }

    setDirectory(dirPath: string, dir: Directory): void {
        for (const [path, file] of Object.entries(dir.files)) {
            const fullPath = join(dirPath, path);
            if (file instanceof Directory) {
                this.files[fullPath] = new Directory({});
                this.setDirectory(fullPath, file);
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
    
    readjson(path: string): any {
        let file = this.getFile(path)[1];
        if (file instanceof File) {
            return file.jsonData;
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

    writejson(path: string, value: any): void {
        const [resolvedPath, file] = this.getFile(path);
        if (file === undefined) {
            const splitPath = split(resolvedPath);
            for (let i = 0; i < splitPath.length; i++) {
                const dir = splitPath.slice(0, i).join('/');
                if (!this.exists(dir)) this.mkdir(dir);
            }
            this.files[resolvedPath] = new File(value, true);
        } else if (this.files[resolvedPath] instanceof File) {
            this.files[resolvedPath].jsonData = value;
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
}
