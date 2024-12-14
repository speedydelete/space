
import type {Time} from './util';

type FixedCycle = {
    type: 'fixed',
    value: number,
} | number;

interface LinearCycle {
    type: 'linear',
    min: Cycle,
    max: Cycle,
    period: Cycle,
    epoch: Time,
}

type Cycle = FixedCycle | LinearCycle | Cycle[];

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
    top: Time,
}

type ObjType = 'star' | 'planet';

interface ObjParams {
    name: string;
    mass: number;
    radius: number;
    flattening: number;
    orbit?: Orbit;
    position?: Position;
    rotation?: Cycle;
    tilt?: number;
    children?: Object[];
}

class _Obj<T extends ObjType = ObjType> {

    type: T;
    name: string;
    mass: number;
    radius: number;
    flattening: number;
    rotation: Cycle;
    tilt: number;
    position: Position;
    orbit?: Orbit;
    constructor(type: T, data: ObjParams) {
        this.type = type;
        this.name = data.name;
        this.mass = data.mass;
        this.radius = data.radius;
        this.flattening = data.flattening;
        this.rotation = data.rotation === undefined ? 0 : data.rotation;
        this.tilt = data.tilt === undefined ? 0 : data.tilt;
        this.position = data.position === undefined ? [0, 0, 0] : data.position;
        this.orbit = data.orbit;
    }

    hasOrbit(): this is OrbitObj {
        return this.orbit !== undefined;
    }

}

interface OrbitObj extends _Obj {
    orbit: Orbit;
}

type SpectralType = string;

type SpectralTypeRegexLiteral = SpectralType;

const spectralTypeColors: {[key: SpectralTypeRegexLiteral]: string} = (await (await fetch('./spectral_type_colors.json')).json());

interface StarParams extends ObjParams {
    magnitude: number;
    spectralType: SpectralType;
    texture?: string;
}

class Star extends _Obj<'star'> {

    magnitude: number = 0;
    spectralType: SpectralType = '~';
    texture?: string;
    constructor(data: StarParams) {
        super('star', data);
        this.magnitude = data.magnitude;
        this.spectralType = data.spectralType;
        this.texture = data.texture;
    }

    get color(): number {
        for (const [type, color] of Object.entries(spectralTypeColors)) {
            if ((new RegExp(type)).test(this.spectralType)) {
                return parseInt(color.replace('#', '0x'));
            }
        }
        return 0x7f7f7f;
    }

}

interface PlanetParams extends ObjParams {
    texture: string;
}

class Planet extends _Obj<'planet'> {
    texture: string;
    constructor(data: PlanetParams) {
        super('planet', data);
        this.texture = data.texture;
    }
}

type Obj = Star | Planet;

const objTypeMap = {
    'star': Star,
    'planet': Planet,
}

interface ObjParamsMap {
    'star': StarParams,
    'planet': PlanetParams,
}

function obj<T extends ObjType>(type: T, params: ObjParamsMap[T]): Obj {
    // @ts-ignore
    return new (objTypeMap[type])(params);
}

export {
    FixedCycle,
    LinearCycle,
    Cycle,
    Position,
    Orbit,
    ObjType,
    OrbitObj,
    Star,
    Planet,
    Obj,
    objTypeMap,
    ObjParamsMap,
    obj,
}
