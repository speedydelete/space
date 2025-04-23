
import SPECTRAL_TYPE_COLORS from './spectral_type_colors.json';


export type Position = [number, number, number];

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

export interface Axis {
    tilt: number;
    period: number | 'sync';
    epoch: number;
    ra: number;
    retrograde?: boolean;
}

export type ObjType = 'star' | 'planet';
export type BaseObjType = 'root' | ObjType;

export interface ObjParams {
    mass: number;
    radius: number;
    axis?: Axis;
    orbit?: Orbit;
    position?: Position;
    offset?: Position;
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

    hasOrbit(): this is OrbitObj {
        return false;
    }

}


export class RootObj extends _BaseObj<'root'> {

    constructor(name: string, designation: string, data: {} = {}) {
        super('root', name, designation);
    }

}


class _Obj<T extends ObjType = ObjType> extends _BaseObj {

    position: Position;
    offset?: Position;
    orbit?: Orbit;
    radius: number;
    mass: number;
    axis?: Axis;
    albedo: number;
    alwaysVisible: boolean;

    constructor(type: T, name: string, designation: string, data: ObjParams) {
        super(type, name, designation);
        this.position = data.position === undefined ? [0, 0, 0] : data.position;
        this.offset = data.offset;
        this.orbit = data.orbit;
        this.radius = data.radius;
        this.mass = data.mass;
        if (data.axis !== undefined) this.axis = data.axis;
        this.albedo = data.albedo === undefined ? 0.09 : data.albedo;
        this.alwaysVisible = data.alwaysVisible === undefined ? false : data.alwaysVisible;
    }

}


export interface OrbitObj extends _Obj {
    orbit: Orbit;
}


export type SpectralType = string;

export type SpectralTypeRegexLiteral = SpectralType;


export interface StarParams extends ObjParams {
    magnitude: number;
    type: SpectralType;
    texture?: string;
}

export class Star extends _Obj<'star'> {

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
    texture?: string;
    type?: string;
}

export class Planet extends _Obj<'planet'> {

    type: 'planet' = 'planet';
    texture?: string;
    spectralType: string;

    constructor(name: string, desgn: string, data: PlanetParams) {
        super('planet', name, desgn, data);
        if (data.texture !== undefined) {
            this.texture = data.texture;
        }
        this.spectralType = data.type === undefined ? '' : data.type;
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

export function obj<T extends BaseObjType>(type: T, params: ObjParamsMap[T] & {name: string, designation: string}): Obj {
    // @ts-ignore
    return new (objTypeMap[type])(params.name, params.designation, params);
}

export default obj;
