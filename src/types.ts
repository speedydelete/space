
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

type Position = [number, number, number];

interface Orbit {
    ap: number,
    pe: number,
    sma: number,
    ecc: number,
    period: number,
    inc: number,
    lan: number,
    aop: number,
    aopEpoch: number,
    top: number,
}

type ObjectType = 'star' | 'planet';

interface ObjectParameters {
    name: string;
    mass: number;
    radius: number;
    flattening: number;
    orbit?: Orbit;
    position?: Position;
    rotation?: Value;
    tilt?: number;
    children?: Object[];
}

class _Object<T extends ObjectType = ObjectType> {
    type: T;
    name: string;
    mass: number;
    radius: number;
    flattening: number;
    rotation: Value = 0;
    tilt: number = 0;
    position: Position = [0, 0, 0];
    orbit?: Orbit;
    children: Object[] = [];
    constructor(type: T, data: ObjectParameters) {
        this.type = type;
        this.name = data.name;
        this.mass = data.mass;
        this.radius = data.radius;
        this.flattening = data.flattening;
        this.orbit = data.orbit;
        if (data.position) this.position = data.position;
        if (data.children) this.children = data.children;
    }
    hasOrbit(): this is OrbitObject {
        return this.orbit !== undefined;
    }
}

interface OrbitObject extends _Object {
    orbit: Orbit;
}

type SpectralType = string;

type SpectralTypeRegexLiteral = SpectralType;

const spectralTypeColors: {[key: SpectralTypeRegexLiteral]: string} = (await (await fetch('./spectral_type_colors.json')).json());

interface StarParameters extends ObjectParameters {
    magnitude: number;
    spectralType: SpectralType;
    texture?: string;
}

class Star extends _Object<'star'> {
    magnitude: number = 0;
    spectralType: SpectralType = '~';
    texture?: string;
    constructor(data: StarParameters) {
        super('star', data);
    }
    get color(): string {
        for (const [type, color] of Object.entries(spectralTypeColors)) {
            if ((new RegExp(type)).test(this.spectralType)) {
                return color;
            }
        }
        return '#7f7f7f';
    }
}

interface PlanetParameters extends ObjectParameters {
    texture: string;
}

class Planet extends _Object<'planet'> {
    texture: string;
    constructor(data: PlanetParameters) {
        super('planet', data);
    }
}

type Object = Star | Planet;

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
    G: number,
    c: number,
    lC: number,
}

export {
    Time,
    FixedValueCycle,
    LinearValueCycle,
    Value,
    Position,
    Orbit,
    ObjectType,
    ObjectParameters,
    StarParameters,
    PlanetParameters,
    _Object,
    Object,
    OrbitObject,
    Star,
    Planet,
    BaseFile,
    File,
    Directory,
    Link,
    FileSystem,
    Settings,
    Config,
}
