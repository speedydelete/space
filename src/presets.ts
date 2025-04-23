
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
        this.setObj('sun', new Star('Sun', 'special:sun', {
            mass: 1.9891e30,
            radius: 6.957e8,
            magnitude: 4.83,
            type: 'G2V',
            axis: {
                tilt: 0,
                period: 2164230,
                epoch: time('2024-01-01 09:10:00'),
                ra: 286.13,
            },
            alwaysVisible: true,
        }));
        this.setObj('sun/mercury', new Planet('mercury', 'planet:mercury', {
            mass: 3.301e23,
            radius: 2439700,
            axis: {
                tilt: 0.034,
                period: 5067360,
                epoch: 0,
                ra: 281.01,
            },
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
            texture: 'data/textures/ssc/mercury_8k.jpg'
        }));
        this.setObj('sun/venus', new Planet('Venus', 'planet:venus', {
            mass: 4.8673e24,
            radius: 6051800,
            axis: {
                tilt: 177.36,
                period: 20997360,
                epoch: 0,
                ra: 272.76,
                retrograde: true,
            },
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
        }));
        this.setObj('sun/earth', new Planet('Earth', 'planet:earth', {
            mass: 5.9722e24,
            radius: 6371000,
            axis: {
                tilt: 23.439,
                period: 86164.100352,
                epoch: 0,
                ra: 0,
            },
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
        }));
        this.setObj('sun/earth/moon', new Planet('moon', 'moon:earth/1', {
            mass: 7.346e22,
            radius: 1737400,
            axis: {
                tilt: 6.68,
                period: 2360592,
                epoch: 0,
                ra: 0,
            },
            albedo: 0.12,
            bondAlbedo: 0.11,
            type: 'V',
            texture: 'data/textures/ssc/moon_8k.jpg',
        }));
        this.setObj('sun/mars', new Planet('Mars', 'planet:mars', {
            mass: 6.4169e23,
            radius: 3389500,
            axis: {
                tilt: 25.19,
                period: 88642.44,
                epoch: 0,
                ra: 317.681,
            },
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
        this.setObj('sun/jupiter', new Planet('Jupiter', 'planet:jupiter', {
            mass: 1.89813e27,
            radius: 69911000,
            axis: {
                tilt: 3.13,
                period: 35730,
                epoch: 0,
                ra: 268.057,
            },
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
            texture: 'data/textures/ssc/jupiter_8k.jpg'
        }));
        this.setObj('sun/saturn', new Planet('Saturn', 'planet:saturn', {
            mass: 5.6832e26,
            radius: 58232000,
            axis: {
                tilt: 26.73,
                period: 38361.6,
                epoch: 0,
                ra: 40.589,
            },
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
        }));
        this.setObj('sun/uranus', new Planet('Uranus', 'planet:uranus', {
            mass: 8.6811e25,
            radius: 25362000,
            axis: {
                tilt: 97.77,
                period: 62064,
                epoch: 0,
                ra: 257.311,
            },
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
        }));
        this.setObj('sun/neptune', new Planet('Neptune', 'planet:neptune', {
            mass: 1.02409e26,
            radius: 24622000,
            axis: {
                period: 57996,
                tilt: 28.32,
                epoch: 0,
                ra: 299.36,
            },
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
        }));
    }),
}
