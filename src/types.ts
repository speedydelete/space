
type Time = number | undefined | string | Date;

type FixedValueCycle = {
    type: 'fixed',
    value: Value,
} | number;

interface LinearValueCycle {
    type: 'linear',
    min: Value,
    max: Value,
    period: Value,
    epoch: Time,
}

type Value = FixedValueCycle | LinearValueCycle | Value[];

type Position = [Value, Value, Value];

interface Rotation {
    x: Value,
    y: Value,
    z: Value,
}

interface Orbit {
    ap: Value,
    pe: Value,
    sma: Value,
    ecc: Value,
    period: Value,
    inc: Value,
    lan: Value,
    aop: Value,
    aopEpoch: Value,
    top: Value,
}

type ObjectType = 'star' | 'planet';

class _Object<T extends ObjectType = ObjectType> {
    name: string;
    type: T;
    color?: Value | string;
    texture?: string;
    magnitude?: Value;
    mass: Value;
    radius: Value;
    flattening: Value;
    rotation?: Value;
    tilt?: Value | {
        value: Value;
        epoch?: Value;
    };
    orbit?: Orbit;
    position?: Position;
    children?: Object[];
    constructor(data: object = {}) {
        Object.entries(data).forEach(([key, value]) => {this[key] = value});
    }
}

interface OrbitObject extends _Object {
    orbit: Orbit;
    position: never;
}

interface PositionObject extends _Object {
    orbit: never;
    position: Position;
}

type Object = OrbitObject | PositionObject;

type FileType = 'regular' | 'directory' | 'link';

class BaseFile {
    type: FileType;
    constructor(type: FileType) {
        this.type = type;
    }
}

class File extends BaseFile {
    data: string;
    constructor(data: string) {
        super('regular');
        this.data = data;
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

interface FileSystem {
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
    }>;
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
    }>;
    [key: string]: BaseFile;
}

interface Settings {
    unitSize: number,
}

interface Config {
    G: Value,
    c: Value,
    lC: Value,
}

export {
    Time,
    FixedValueCycle,
    LinearValueCycle,
    Value,
    Position,
    Rotation,
    Orbit,
    ObjectType,
    _Object,
    OrbitObject,
    PositionObject,
    Object,
    BaseFile,
    File,
    Directory,
    Link,
    FileSystem,
    Settings,
    Config,
}
