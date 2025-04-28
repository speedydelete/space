
import {FileObject, Directory, join, normalize} from 'fake-system';
import {Vector3} from './util';
import SPECTRAL_TYPE_COLORS from './spectral_type_colors.json';


export interface Orbit {
    at: number;
    sma: number;
    ecc: number;
    mna: number;
    inc: number;
    lan: number;
    aop: number;
    retrograde?: boolean;
    aopPrecession?: number;
}


export type ObjType = 'star' | 'planet';
export type BaseObjType = 'root' | ObjType;

export interface ObjParams {
    mass: number;
    radius: number;
    position?: Vector3;
    velocity?: Vector3;
    rotation?: Vector3;
    rotationChange?: Vector3;
    orbit?: Orbit;
    gravity?: boolean;
    useOrbitForGravity?: boolean;
    nbody?: boolean;
    albedo?: number;
    bondAlbedo?: number;
    alwaysVisible?: boolean;
    children?: Object[];
}


class _BaseObj<T extends BaseObjType = BaseObjType> {

    type: T;
    name: string;
    designation: string;

    constructor(type: T, name: string, designation: string, data: {} = {}) {
        this.type = type;
        this.name = name;
        this.designation = designation;
    }

}


export class RootObj extends _BaseObj<'root'> {

    constructor(name: string, designation: string, data: {} = {}) {
        super('root', name, designation);
    }

}


class BaseObj<T extends ObjType = ObjType> extends _BaseObj {

    mass: number;
    radius: number;
    position: Vector3;
    velocity: Vector3;
    rotation: Vector3;
    rotationChange: Vector3;
    orbit?: Orbit;
    gravity: boolean;
    useOrbitForGravity: boolean;
    nbody: boolean;
    alwaysVisible: boolean;

    constructor(type: T, name: string, designation: string, data: ObjParams) {
        super(type, name, designation);
        this.position = data.position ?? new Vector3(0, 0, 0);
        this.velocity = data.velocity ?? new Vector3(0, 0, 0);
        this.rotation = data.rotation ?? new Vector3(0, 0, 0);
        this.rotationChange = data.rotationChange ?? new Vector3(0, 0, 0);
        this.orbit = data.orbit;
        this.radius = data.radius;
        this.mass = data.mass;
        this.gravity = data.gravity ?? true;
        this.useOrbitForGravity = data.useOrbitForGravity ?? false;
        this.nbody = data.nbody ?? false;
        this.alwaysVisible = data.alwaysVisible === undefined ? false : data.alwaysVisible;
    }

}


export type SpectralType = string;

export type SpectralTypeRegexLiteral = SpectralType;


export interface StarParams extends ObjParams {
    magnitude: number;
    type: SpectralType;
    texture?: string;
}

export class Star extends BaseObj<'star'> {

    type: 'star' = 'star';
    magnitude: number;
    spectralType: SpectralType;
    texture?: string;

    constructor(name: string, desgn: string, data: StarParams) {
        super('star', name, desgn, data);
        this.magnitude = data.magnitude;
        this.spectralType = data.type;
        this.texture = data.texture;
    }

    get color(): number {
        for (const [type, color] of Object.entries(SPECTRAL_TYPE_COLORS)) {
            if ((new RegExp(type)).test(this.type)) {
                return parseInt((color as string).replace('#', '0x'));
            }
        }
        return 0x7f7f7f;
    }

}


export interface PlanetParams extends ObjParams {
    albedo?: number;
    bondAlbedo?: number;
    texture?: string;
    type?: string;
}

export class Planet extends BaseObj<'planet'> {

    type: 'planet' = 'planet';
    texture?: string;
    spectralType: string;
    albedo?: number;
    bondAlbedo?: number;

    constructor(name: string, desgn: string, data: PlanetParams) {
        super('planet', name, desgn, data);
        if (data.texture !== undefined) {
            this.texture = data.texture;
        }
        this.spectralType = data.type === undefined ? '' : data.type;
        this.albedo = data.albedo;
        this.bondAlbedo = data.bondAlbedo;
    }
}


export type Obj = Star | Planet;
export type ObjIncludingRoot = RootObj | Obj;

export const OBJ_TYPE_MAP = {
    'root': RootObj,
    'star': Star,
    'planet': Planet,
}

export interface ObjParamsMap {
    'root': {},
    'star': StarParams,
    'planet': PlanetParams,
}

export type ObjKey = keyof Star | keyof Planet;
export type TypeOfObjKey<T extends ObjKey> = T extends keyof Star ? Star[T] : (T extends keyof Planet ? Planet[T] : never);


export class ObjDir extends FileObject {

    rootObj: RootObj;
    objs: Map<string, Obj> = new Map();

    constructor() {
        super({mode: 0x3000, uid: 0, gid: 0});
        this.rootObj = new RootObj('', 'special:root');
    }

    get(path: string): Obj {
        path = normalize(path);
        if (path.startsWith('/')) {
            path = path.slice(1);
        }
        if (path === '') {
            // @ts-ignore
            return this.rootObj;
        }
        let obj = this.objs.get(path);
        if (!obj) {
            throw new Error(`Object ${path} does not exist`);
        }
        return obj;
    }

    set(path: string, obj: Obj): void {
        path = normalize(path);
        if (path.startsWith('/')) {
            path = path.slice(1);
        }
        this.objs.set(path, obj);
    }

    getParentPath(path: string): string {
        return path.split('/').slice(0, -1).join('/');
    }

    getParent(path: string): Obj {
        return this.get(this.getParentPath(path));
    }

    getProp<T extends ObjKey>(path: string, prop: T): TypeOfObjKey<T>;
    getProp<T extends ObjKey, U extends keyof Exclude<TypeOfObjKey<T>, undefined> & string>(path: string, prop: `${T}.${U}`): Exclude<TypeOfObjKey<T>, undefined>[U];
    getProp(path: string, prop: string): any {
        let obj = this.get(path);
        if (prop.includes('.')) {
            let [a, b] = prop.split('.');
            // @ts-ignore
            return obj[a][b];
        } else {
            // @ts-ignore
            return obj[prop];
        }
    }

    setProp<T extends ObjKey>(path: string, prop: T, value: TypeOfObjKey<T>): void;
    setProp<T extends ObjKey, U extends keyof Exclude<TypeOfObjKey<T>, undefined> & string>(path: string, prop: `${T}.${U}`, value: Exclude<TypeOfObjKey<T>, undefined>[U]): void;
    setProp(path: string, prop: string, value: any): void {
        let obj = this.get(path);
        if (prop.includes('.')) {
            let [a, b] = prop.split('.');
            // @ts-ignore
            obj[a][b] = value;
        } else {
            // @ts-ignore
            obj[prop] = value;
        }
        this.set(path, obj);
    }

    getPaths(start?: string, recursive?: boolean): string[] {
        if (start === undefined && recursive === undefined) {
            start = '';
            recursive = true;
        } else {
            start ??= '';
            recursive ??= false;
        }
        let out: string[] = [];
        for (let path of this.objs.keys()) {
            if (path.startsWith(start)) {
                if (recursive || !path.slice(start.length).includes('/')) {
                    out.push(path);
                }
            }
        }
        return out;
    }

    _toDir(start: string, dir: Directory): void {
        for (let path of this.getPaths(start)) {
            let subDir = dir.mkdir(path);
            subDir.write('.object', JSON.stringify(this.get(path)));
            this._toDir(start, subDir);
        }
    }

    toDir(): Directory {
        let out = new Directory(null, new Map(), {uid: this.uid, gid: this.gid});
        this._toDir('', out);
        return out;
    }

    fromDir(start: string, dir: Directory): void {
        let data = JSON.parse(dir.read('.object'));
        // @ts-ignore
        this.set(start, Object.assign(Object.create(OBJ_TYPE_MAP[data.type]), data));
        for (let path of dir.files.keys()) {
            let file = dir.get(path);
            if (file instanceof Directory) {
                this.fromDir(join(start, path), dir);
            }
        }
    }

    static fromDir(dir: Directory): ObjDir {
        let out = new ObjDir();
        out.fromDir('', dir);
        return out;
    }

}
