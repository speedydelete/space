
type FixedCycle = {
    type: 'fixed',
    value: number,
} | number;

interface LinearCycle {
    type: 'linear',
    min: Cycle,
    max: Cycle,
    period: Cycle,
    epoch?: Date,
}

type Cycle = FixedCycle | LinearCycle | Cycle[];

type Position = [number, number, number];

interface Orbit {
    at?: Date | string,
    sma: number,
    ecc?: number,
    mna?: number,
    inc?: number,
    lan?: number,
    aop?: number,
    retrograde?: boolean;
}

interface Axis {
    tilt: number,
    period: number | 'sync',
    epoch: Date,
    ra: number,
}

type ObjType = 'star' | 'planet';
type BaseObjType = 'root' | ObjType;

interface ObjParams {
    mass: number;
    radius: number;
    axis?: Axis;
    orbit?: Orbit;
    position?: Position;
    tilt?: number;
    albedo?: number;
    children?: Object[];
}

class _BaseObj<T extends BaseObjType = BaseObjType> {

    $type: T;
    name: string;
    designation: string;

    constructor(type: T, name: string, designation: string, data: {} = {}) {
        this.$type = type;
        this.name = name;
        this.designation = designation;
    }

    hasOrbit(): this is OrbitObj {
        return false;
    }
}

class RootObj extends _BaseObj<'root'> {

    constructor(name: string, designation: string, data: {} = {}) {
        super('root', name, designation, data);
    }

}

class _Obj<T extends ObjType = ObjType> extends _BaseObj {

    position: Position;
    orbit?: Orbit;
    radius: number;
    mass: number;
    axis?: Axis;
    albedo: number;

    constructor(type: T, name: string, designation: string, data: ObjParams) {
        super(type, name, designation);
        this.position = data.position === undefined ? [0, 0, 0] : data.position;
        this.orbit = data.orbit;
        this.radius = data.radius;
        this.mass = data.mass;
        if (data.axis !== undefined) this.axis = data.axis;
        this.albedo = data.albedo === undefined ? 0.09 : data.albedo;
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

const spectralTypeColors: {[key: SpectralTypeRegexLiteral]: string} = (await (await fetch('./data/spectral_type_colors.json')).json());

interface StarParams extends ObjParams {
    magnitude: number;
    type: SpectralType;
    texture?: string;
}

class Star extends _Obj<'star'> {

    $type: 'star' = 'star';
    magnitude: number;
    type: SpectralType;
    texture?: string;

    constructor(name: string, desgn: string, data: StarParams) {
        super('star', name, desgn, data);
        this.magnitude = data.magnitude;
        this.type = data.type;
        this.texture = data.texture;
    }

    get color(): number {
        for (const [type, color] of Object.entries(spectralTypeColors)) {
            if ((new RegExp(type)).test(this.type)) {
                return parseInt(color.replace('#', '0x'));
            }
        }
        return 0x7f7f7f;
    }

}

interface PlanetParams extends ObjParams {
    texture?: string;
    type?: string;
}

class Planet extends _Obj<'planet'> {

    $type: 'planet' = 'planet';
    texture: string;
    type: string;

    constructor(name: string, desgn: string, data: PlanetParams) {
        super('planet', name, desgn, data);
        if (data.texture !== undefined) this.texture = data.texture;
        this.type = data.type === undefined ? '' : data.type;
    }
}

type Obj = Star | Planet;
type ObjIncludingRoot = RootObj | Obj;

const objTypeMap = {
    'root': RootObj,
    'star': Star,
    'planet': Planet,
}

interface ObjParamsMap {
    'root': {},
    'star': StarParams,
    'planet': PlanetParams,
}

function obj<T extends BaseObjType>(type: T, params: ObjParamsMap[T] & {name: string, designation: string}): Obj {
    // @ts-ignore
    return new (objTypeMap[type])(params.name, params.designation, params);
}

export {
    FixedCycle,
    LinearCycle,
    Cycle,
    Position,
    Orbit,
    Axis,
    ObjType,
    BaseObjType,
    _BaseObj,
    RootObj,
    _Obj,
    OrbitObj,
    Star,
    Planet,
    Obj,
    ObjIncludingRoot,
    objTypeMap,
    ObjParamsMap,
    obj,
}
