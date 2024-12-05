
type Time = number | undefined | string | Date | Value<Time>;

interface FixedValueCycle<T> {
    type: 'fixed',
    value: Value<T>,
}

type FixedValueCycle<T> = T;

interface LinearValueCycle<T> {
    type: 'linear',
    min: Value<T>,
    max: Value<T>,
    period: Value<T>,
    epoch: Time,
}

type MultiCycle<T> = ValueCycle<T>[];

type ValueCycle<T> = FixedValue<T> | LinearValueCycle<T> | MultiCycle<T>;

type Value<T> = T | ValueCycle<T>;

type Position = [Value<number>, Value<number>, Value<number>];

interface Rotation {
    x: Value<number>,
    y: Value<number>,
    z: Value<number>,
}

interface Orbit {
    ap: Value<number>,
    pe: Value<number>,
    sma: Value<number>,
    ecc: Value<number>,
    period: Value<number>,
    inc: Value<number>,
    lan: Value<number>,
    aop: Value<number>,
    aopEpoch: Value<number>,
    top: Value<number>,
}

type ObjectType = 'star' | 'planet';

class Object<T extends ObjectType = ObjectType> {
    name: string;
    type: T;
    color?: Value<string | number>;
    texture?: string;
    magnitude?: Value<number>;
    mass: Value<number>;
    radius: Value<number>;
    flattening: Value<number>;
    rotation?: Value<number>;
    tilt?: Value<number> | {
        value: Value<number>;
        epoch?: Value<number>;
    };
    orbit?: Orbit;
    position?: Position;
    children?: Object[];
    constructor(data: object = {}): void {
        for (const [key, value] of data) {
            this[key] = value;
        }
    }
}

type FileType = 'regular' | 'directory' | 'link';

class BaseFile {
    type: FileType;
    constructor(type: FileType): void {
        this.type = type;
    }
}

class File extends BaseFile {
    data: string;
    constructor(data: string): void {
        super('regular');
        this.data = data;
    }
}

class Directory<T extends {[key: string]: BaseFile} | BaseFile = {[key: string]: BaseFile}> extends BaseFile {
    files: {[key: string]: BaseFile};
    constructor(files: (T extends {[key: string]: BaseFile} ? T : {[key: string]: T}) | {} = {}): void {
        super('directory');
        this.files = files;
    }
}

class Link<T extends string = string> extends BaseFile {
    path: string;
    constructor(path: T): void {
        super('link');
        this.path = path;
    }
}

class FileSystem extends Directory {
    bin: Directory;
    boot: Directory;
    dev: Directory;
    etc: Directory<{
        'config.json': File,
    }>;
    home: Directory<{
        root: Link<'/root/'>,
        objects: Directory,
    }>;
    lib: Directory;
    media: Directory;
    mnt: Directory;
    opt: Directory;
    proc: Directory;
    root: Directory;
    sbin: Directory;
    srv: Directory;
    sys: Directory;
    tmp: Directory;
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
    }>,
}

interface Settings {
    unitSize: number,
}

interface Config {
    G: Value<number>,
    c: Value<number>,
    lC: Value<number>,
}

export {
    Time,
    FixedValueCycle,
    LinearValueCycle,
    MultiCycle,
    ValueCycle,
    Value,
    Position,
    Rotation,
    Orbit,
    ObjectType,
    Object,
    BaseFile,
    File,
    Directory,
    Link,
    FileSystem,
    Settings,
    Config,
}
