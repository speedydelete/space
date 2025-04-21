
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
        this.setObj('sun/earth', new Planet('Earth', 'planet:earth', {
            mass: 5.9722e24,
            radius: 6371000,
            axis: {
                tilt: 23.439,
                period: 86400,
                epoch: 0,
                ra: 0,
            },
            orbit: {
                at: J2000,
                sma: 149597887155.8,
                ecc: 0.01671022,
                mna: -2.48284,
                inc: 0.00005,
                lan: -11.26064,
                aop: 114.20783,
            },
            position: [150000000000, 0, 0],
            albedo: 0.434,
            bondAlbedo: 0.294,
            texture: 'data/textures/ssc/earth_8k.jpg',
            type: 'V',
        }));
    }),
}
