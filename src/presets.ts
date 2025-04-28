
import {Vector3} from './util';
import {Planet, Star} from './obj';
import {World} from './world';


function createPreset(func: (this: World) => void) {
    let out = new World();
    func.call(out);
    return out;
}


function time(value: string): number {
    return Date.parse(value) * 1000;
}

const J2000 = 946684800;
const AU = 149597870700;


export default {
    empty: createPreset(function() {}),
    default: createPreset(function() {
        this.config = {
            tps: 20,
            c: 299792458,
            G: 6.6743e-11,
            lC: 3.2065e+30,
            initialTarget: 'sun/earth',
        };
        this.set('sun', new Star('Sun', 'special:sun', {
            mass: 1.9891e30,
            radius: 6.957e8,
            rotation: new Vector3(286.13, 0, 0),
            rotationChange: new Vector3(0, 0, 360/2164230),
            magnitude: 4.83,
            type: 'G2V',
            alwaysVisible: true,
        }));
        this.set('sun/mercury', new Planet('Mercury', 'planet:mercury', {
            mass: 3.301e23,
            radius: 2439700,
            rotation: new Vector3(281.01, 0.034, 0),
            rotationChange: new Vector3(0, 0, 360/5067360),
            orbit: {
                at: J2000,
                sma: 0.38709893 * AU,
                ecc: 0.20563069,
                mna: 174.79439,
                inc: 7.00487,
                lan: 48.33167,
                aop: 29.12478,
            },
            albedo: 0.142,
            bondAlbedo: 0.068,
            type: 'M',
            texture: 'data/textures/ssc/mercury_8k.jpg',
            useOrbitForGravity: true,
        }));
        this.set('sun/venus', new Planet('Venus', 'planet:venus', {
            mass: 4.8673e24,
            radius: 6051800,
            rotation: new Vector3(272.26, 177.36, 0),
            rotationChange: new Vector3(0, 0, 360/20997360),
            orbit: {
                at: J2000,
                sma: 0.72333199 * AU,
                ecc: 0.00677323,
                mna: 50.44675,
                inc: 3.39471,
                lan: 76.68069,
                aop: 54.85229,
            },
            albedo: 0.689,
            bondAlbedo: 0.77,
            type: 'C',
            texture: 'data/textures/ssc/venus_atmosphere_4k.jpg',
            useOrbitForGravity: true,
        }));
        this.set('sun/earth', new Planet('Earth', 'planet:earth', {
            mass: 5.9722e24,
            radius: 6371000,
            rotation: new Vector3(0, 23.439, 0),
            rotationChange: new Vector3(0, 0, 360/86164.100352),
            orbit: {
                at: J2000,
                sma: 1.00000011 * AU,
                ecc: 0.01671022,
                mna: -2.48284,
                inc: 0,
                lan: 102.94719,
                aop: 114.20783,
                aopPrecession: 1/(112000 * 86400 * 365.25),
            },
            albedo: 0.434,
            bondAlbedo: 0.294,
            type: 'V',
            texture: 'data/textures/ssc/earth_8k.jpg',
            useOrbitForGravity: true,
        }));
        this.set('sun/earth/moon', new Planet('Moon', 'moon:earth/1', {
            mass: 7.346e22,
            radius: 1737400,
            rotation: new Vector3(0, 6.68, 0),
            rotationChange: new Vector3(0, 0, 360/2360592),
            orbit: {
                at: J2000,
                sma: 383398000,
                ecc: 0.0549,
                mna: 0,
                inc: 5.145,
                lan: 0,
                aop: 0,
            },
            albedo: 0.12,
            bondAlbedo: 0.11,
            type: 'V',
            texture: 'data/textures/ssc/moon_8k.jpg',
        }));
        this.set('sun/mars', new Planet('Mars', 'planet:mars', {
            mass: 6.4169e23,
            radius: 3389500,
            rotation: new Vector3(317.681, 25.19, 0),
            rotationChange: new Vector3(0, 0, 360/88642.44),
            orbit: {
                at: J2000,
                sma: 1.52366231 * AU,
                ecc: 0.09341233,
                mna: 19.41248,
                inc: 1.85061,
                lan: 49.57854,
                aop: 286.4623,
            },
            albedo: 0.170,
            bondAlbedo: 0.250,
            type: 'S',
            texture: 'data/textures/ssc/mars_8k.jpg',
        }));
        this.set('sun/jupiter', new Planet('Jupiter', 'planet:jupiter', {
            mass: 1.89813e27,
            radius: 69911000,
            rotation: new Vector3(268.057, 3.13, 0),
            rotationChange: new Vector3(0, 0, 360/35730),
            orbit: {
                at: J2000,
                sma: 5.20336301 * AU,
                ecc: 0.04839266,
                mna: 19.65053,
                inc: 1.30530,
                lan: 100.55615,
                aop: -85.8023,
            },
            albedo: 0.538,
            bondAlbedo: 0.343,
            type: 'D',
            texture: 'data/textures/ssc/jupiter_8k.jpg',
            useOrbitForGravity: true,
        }));
        this.set('sun/saturn', new Planet('Saturn', 'planet:saturn', {
            mass: 5.6832e26,
            radius: 58232000,
            rotation: new Vector3(40.589, 26.73, 0),
            rotationChange: new Vector3(0, 0, 360/38361.6),
            orbit: {
                at: J2000,
                sma: 9.53707032 * AU,
                ecc: 0.05415060,
                mna: -42.48762,
                inc: 2.48446,
                lan: 113.71504,
                aop: -21.2831,
            },
            albedo: 0.499,
            bondAlbedo: 0.342,
            type: 'D',
            texture: 'data/textures/ssc/saturn_8k.jpg',
            useOrbitForGravity: true,
        }));
        this.set('sun/uranus', new Planet('Uranus', 'planet:uranus', {
            mass: 8.6811e25,
            radius: 25362000,
            rotation: new Vector3(257.311, 97.77, 0),
            rotationChange: new Vector3(0, 0, 360/62064),
            orbit: {
                at: J2000,
                sma: 19.19126393 * AU,
                ecc: 0.04716771,
                mna: 142.26794,
                inc: 0.76986,
                lan: 74.22988,
                aop: 96.73436,
            },
            albedo: 0.488,
            bondAlbedo: 0.300,
            type: 'P',
            texture: 'data/textures/ssc/uranus.jpg',
            useOrbitForGravity: true,
        }));
        this.set('sun/neptune', new Planet('Neptune', 'planet:neptune', {
            mass: 1.02409e26,
            radius: 24622000,
            rotation: new Vector3(299.36, 28.32, 0),
            rotationChange: new Vector3(0, 0, 360/57996),
            orbit: {
                at: J2000,
                sma: 30.06896348 * AU,
                ecc: 0.00858587,
                mna: 259.90868,
                inc: 1.76917,
                lan: 131.72169,
                aop: -86.75034,
            },
            albedo: 0.442,
            bondAlbedo: 0.290,
            type: 'P',
            texture: 'data/textures/ssc/neptune.jpg',
            useOrbitForGravity: true,
        }));
        this.setPositionVelocityFromOrbit('sun/mercury');
        this.setPositionVelocityFromOrbit('sun/venus');
        this.setPositionVelocityFromOrbit('sun/earth');
        this.setPositionVelocityFromOrbit('sun/earth/moon');
        this.setPositionVelocityFromOrbit('sun/mars');
        this.setPositionVelocityFromOrbit('sun/jupiter');
        this.setPositionVelocityFromOrbit('sun/saturn');
        this.setPositionVelocityFromOrbit('sun/uranus');
        this.setPositionVelocityFromOrbit('sun/neptune');
    }),
}
