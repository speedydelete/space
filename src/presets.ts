
import type {Axis, BaseObjType, Obj, ObjParamsMap} from './obj.ts';
import {objTypeMap} from './obj.ts';
import {type BaseFile, File, Directory, Link} from './files.ts';
import {World} from './world.ts';

function file(data: string | Obj | any): File {
    return new File(data);
}

function directory(files: {[key: string]: BaseFile} = {}): Directory {
    return new Directory(files);
}

function link<T extends string = string>(path: T): Link {
    return new Link(path);
}

function jd(value: number): Date {
    return new Date((value - 2440587.5) * 86400000);
}

function date(value: number | string | Date): Date {
    return new Date(value);
}

const J2000: Date = jd(2451545.0);

function axis(tilt: number | null, period: number | 'sync', epoch: number | string | Date | null = null, ra: number | null = null): Axis {
    return {
        tilt: tilt === null ? 0 : tilt,
        period: period,
        epoch: epoch === null ? J2000 : date(epoch),
        ra: ra === null ? 0 : ra,
    }
}

function objdir<T extends BaseObjType>(type: T, name: string, designation: string, params: ObjParamsMap[T], children: {[key: string]: Directory} = {}) {
    return directory({
        // @ts-ignore
        object: new File(new objTypeMap[type](name, designation, params)),
        ...children,
    });
}

const baseFileStructure = directory({
    bin: directory(),
    boot: directory(),
    dev: directory(),
    etc: directory({
        config: file({
            tps: 20,
            c: 299792458,
            G: 6.6743e-11,
            lC: 3.2065e+30,
            initialTarget: '',
        }),
        time: file((new Date()).toISOString()),
        version: file('0.3.0'),
    }),
    home: directory({
        root: link('/root/'),
        objects: directory(),
    }),
    lib: directory(),
    media: directory(),
    mnt: directory(),
    opt: directory(),
    proc: directory(),
    root: directory(),
    sbin: directory(),
    srv: directory(),
    sys: directory(),
    tmp: directory(),
    usr: directory({
        bin: link('/bin'),
        include: directory(),
        lib: directory(),
        libexec: directory(),
        local: directory(),
        sbin: link('/sbin'),
        share: directory(),
        src: directory(),
    }),
    var: directory({
        cache: directory(),
        lib: directory(),
        lock: directory(),
        log: directory(),
        mail: directory(),
        opt: directory(),
        run: directory(),
        spool: directory(),
        tmp: directory(),
    }),
});

const emptyWorld = new World(baseFileStructure);

const solarSystemWorld = new World(baseFileStructure);
solarSystemWorld.config.initialTarget = 'sun/earth';
solarSystemWorld.setDirectory('/home/objects', objdir('root', 'root', 'special:root', {}, {
    sun: objdir('star', 'Sun', 'special:sun', {
        position: [0, 0, 0],
        mass: 1.9891e30,
        radius: 695700000,
        axis: axis(0, 2164230, '2024-01-01 09:10:00', 286.13),
        texture: 'data/textures/ssc/sun_8k.jpg',
        magnitude: 4.83,
        type: 'G2V',
        alwaysVisible: true,
    }, {
        mercury: objdir('planet', 'Mercury', 'planet:mercury', {
            orbit: {
                at: J2000,
                sma: 57909036552,
                ecc: 0.205630,
                mna: 174.796,
                inc: 3.38,
                lan: 48.331,
                aop: 29.124,
            },
            radius: 2440500,
            mass: 3.3011e23,
            axis: axis(0.034, 5067014.4, null, 281.01),
            albedo: 0.142,
            texture: 'data/textures/ssc/mercury_8k.jpg',
        }),
        venus: objdir('planet', 'Venus', 'planet:venus', {
            orbit: {
                at: J2000,
                sma: 108208927010,
                ecc: 0.006772,
                mna: 50.115,
                inc: 3.86,
                lan: 76.680,
                aop: 54.884,
            },
            radius: 6051800,
            mass: 4.8675e24,
            axis: axis(177.36, 20997152.64, null, 272.76),
            albedo: 0.689,
            texture: 'data/textures/ssc/venus_atmosphere_4k.jpg',
        }),
        earth: objdir('planet', 'Earth', 'planet:earth', {
            orbit: {
                at: J2000,
                sma: 149598023000,
                ecc: 0.0167086,
                mna: 358.617,
                inc: 7.155,
                lan: -11.26064,
                aop: 114.20783,
            },
            radius: 6371000,
            mass: 5.972168e24,
            axis: axis(23.4392811, 86164.100352, date('2024-04-15 20:00:00'), 0),
            albedo: 0.367,
            texture: 'data/textures/ssc/earth_8k.jpg',
        }, {
            moon: objdir('planet', 'Moon', 'moon:earth/1', {
                orbit: {
                    at: J2000,
                    sma: 384399000,
                    ecc: 0.0549,
                    mna: 249.9439,
                    inc: 28.645,
                    lan: 125.04452,
                    aop: 318.15156,
                },
                radius: 1738100,
                mass: 7.346e22,
                axis: axis(6.687, 'sync', 266.86),
                albedo: 0.136,
                texture: 'data/textures/ssc/moon_8k.jpg',
            }),
        }),
        mars: objdir('planet', 'Mars', 'planet:mars', {
            orbit: {
                at: J2000,
                sma: 227939366000,
                ecc: 0.0934,
                mna: 19.412,
                inc: 5.65,
                lan: 49.57854,
                aop: 286.5,
            },
            radius: 3396200,
            mass: 6.4171e23,
            axis: axis(25.19, 88642.6848, null, 317.269),
            albedo: 0.17,
            texture: 'data/textures/ssc/mars_8k.jpg',
        }, {
            phobos: objdir('planet', 'Phobos', 'moon:mars/1', {
                orbit: {
                    at: J2000,
                    sma: 9376000,
                    ecc: 0.0151,
                    inc: 1.093,
                },
                radius: 11080,
                mass: 1.06e16,
                axis: axis(0, 'sync', null, null),
                albedo: 0.07,
                texture: 'data/textures/nasa/phobos.jpg',
            }),
            deimos: objdir('planet', 'Deimos', 'moon:mars/2', {
                orbit: {
                    at: date('2012-09-23'),
                    sma: 23463200,
                    ecc: 0.00033,
                    inc: 0.93,
                },
                radius: 6270,
                mass: 1.51e15,
                axis: axis(null, 'sync', null, null),
                albedo: 0.068,
                texture: 'data/textures/nasa/deimos.jpg'
            }),
        }),
        jupiter: objdir('planet', 'Jupiter', 'planet:jupiter', {
            orbit: {
                at: J2000,
                sma: 778479000000,
                ecc: 0.0489,
                mna: 0.02,
                inc: 6.09,
                lan: 100.464,
            },
            radius: 69911000,
            mass: 1.8982e27,
            axis: axis(3.13, 35730, null, 268.057),
            albedo: 0.538,
            texture: 'data/textures/ssc/jupiter.jpg',
        }, {
            io: objdir('planet', 'Io', 'moon:jupiter/1', {
                orbit: {
                    sma: 421700000,
                    ecc: 0.0040313019,
                    inc: 0.05,
                },
                radius: 1821600,
                mass: 8.931938e22,
                axis: axis(null, 'sync', 268.05),
                albedo: 0.63,
                texture: 'data/textures/nasa/io.jpg',
            }),
            europa: objdir('planet', 'Europa', 'moon:jupiter/2', {
                orbit: {
                    at: date('2004-01-08'),
                    sma: 670900000,
                    ecc: 0.009,
                    inc: 0.47,
                },
                radius: 1560800,
                mass: 4.79984e22,
                axis: axis(0.1, 'sync', 268.08),
                albedo: 0.67,
                texture: 'data/textures/nasa/europa.jpg',
            }),
            ganymede: objdir('planet', 'Ganymede', 'moon:jupiter/3', {
                orbit: {
                    sma: 1070400000,
                    ecc: 0.0013,
                    inc: 0.2,
                },
                radius: 2634100,
                mass: 1.4819e23,
                axis: axis(0.165, 'sync', 268.2),
                albedo: 0.43,
                texture: 'data/textures/nasa/ganymede.jpg',
            }),
            callisto: objdir('planet', 'Callisto', 'moon:jupiter/4', {
                orbit: {
                    sma: 1882700000,
                    ecc: 0.00074,
                    inc: 0.192,
                },
                radius: 2410300,
                mass: 1.075938e23,
                axis: axis(1.8, 'sync', 268.72),
                albedo: 0.22,
                texture: 'data/textures/nasa/callisto.jpg',
            }),
        }),
        saturn: objdir('planet', 'Saturn', 'planet:saturn', {
            orbit: {
                at: J2000,
                sma: 1.43353e12,
                ecc: 0.0565,
                mna: 317.02,
                inc: 5.51,
                lan: 113.665,
                aop: 339.392,
            },
            radius: 60268000,
            mass: 5.6834e26,
            axis: axis(26.73, 38018, null, 40.589),
            albedo: 0.499,
            texture: 'data/textures/ssc/saturn.jpg',
        }, {
            mimas: objdir('planet', 'Mimas', 'moon:saturn/1', {
                orbit: {
                    sma: 185539000,
                    ecc: 0.0196,
                    inc: 1.754,
                },
                mass: 3.75094e19,
                radius: 198200,
                axis: axis(0, 'sync'),
                albedo: 0.962,
                texture: 'data/textures/nasa/mimas.jpg',
            }),
            enceladus: objdir('planet', 'Enceladus', 'moon:saturn/2', {
                orbit: {
                    sma: 237948000,
                    ecc: 0.0047,
                    inc: 0.009,
                },
                radius: 252100,
                mass: 1.080318e20,
                axis: axis(0, 'sync'),
                albedo: 1.375,
                texture: 'data/textures/nasa/enceladus.jpg',
            }),
            tethys: objdir('planet', 'Tethys', 'moon:saturn/3', {
                orbit: {
                    sma: 294619000,
                    ecc: 0.0001,
                    inc: 1.12,
                },
                radius: 531100,
                mass: 6.1749e20,
                axis: axis(0, 'sync'),
                albedo: 1.229,
                texture: 'data/textures/nasa/tethys.jpg',
            }),
            dione: objdir('planet', 'Dione', 'moon:saturn/4', {
                orbit: {
                    sma: 377396000,
                    ecc: 0.0022,
                    inc: 0.019,
                },
                radius: 561400,
                mass: 1.0954868e21,
                axis: axis(0, 'sync'),
                albedo: 0.998,
                texture: 'data/textures/nasa/dione.jpg',
            }),
            rhea: objdir('planet', 'Rhea', 'moon:saturn/5', {
                orbit: {
                    sma: 527040000,
                    ecc: 0.001,
                    inc: 0.35,
                },
                radius: 763500,
                mass: 2.3064854e21,
                axis: axis(0, 'sync'),
                albedo: 0.949,
                texture: 'data/textures/nasa/rhea.jpg',
            }),
            titan: objdir('planet', 'Titan', 'moon:saturn/6', {
                orbit: {
                    sma: 1221870000,
                    ecc: 0.0288,
                    inc: 0.34854,
                },
                radius: 2574730,
                mass: 1.3452e23,
                axis: axis(0, 'sync'),
                albedo: 0.22,
                texture: 'data/textures/nasa/titan.jpg',
            }),
            hyperion: objdir('planet', 'Hyperion', 'moon:saturn/7', {
                orbit: {
                    sma: 1.481e9,
                    ecc: 0.1230061,
                    inc: 0.43,
                },
                radius: 135000,
                mass: 5.551e18,
                albedo: 0.13,
            }),
            iapetus: objdir('planet', 'Iapetus', 'moon:saturn/8', {
                orbit: {
                    sma: 3560820000,
                    ecc: 0.0276812,
                    inc: 15.47,
                },
                radius: 734400,
                mass: 1.80565e21,
                axis: axis(0, 'sync'),
                albedo: 0.5,
                texture: 'data/textures/nasa/iapetus.jpg',
            }),
        }),
        uranus: objdir('planet', 'Uranus', 'planet:uranus', {
            orbit: {
                at: J2000,
                sma: 2.870972e12,
                ecc: 0.04717,
                mna: 142.2386,
                inc: 6.48,
                lan: 74.006,
                aop: 96.998857,
            },
            radius: 25559000,
            mass: 8.681e25,
            axis: axis(97.77, 62064, null, 257.311),
            albedo: 0.488,
            texture: 'data/textures/ssc/uranus.jpg',
        }, {
            ariel: objdir('planet', 'Ariel', 'moon:uranus/1', {
                orbit: {
                    sma: 190100000,
                    ecc: 0.0012,
                    inc: 0.26,
                },
                radius: 578900,
                mass: 1.2331e21,
                axis: axis(null, 'sync'),
                albedo: 0.53,
                texture: 'data/textures/nasa/ariel.jpg',
            }),
            umbriel: objdir('planet', 'Umbriel', 'moon:uranus/2', {
                orbit: {
                    sma: 266000000,
                    ecc: 0.0039,
                    inc: 0.128,
                },
                radius: 584700,
                mass: 1.2885e21,
                axis: axis(0, 'sync'),
                albedo: 0.26,
                texture: 'data/textures/nasa/umbriel.jpg',
            }),
            titania: objdir('planet', 'Titania', 'moon:uranus/3', {
                orbit: {
                    sma: 435910000,
                    ecc: 0.0011,
                    inc: 0.34,
                },
                radius: 788400,
                mass: 3.455e21,
                axis: axis(0, 'sync'),
                albedo: 0.35,
                texture: 'data/textures/nasa/titania.jpg',
            }),
            oberon: objdir('planet', 'Oberon', 'moon:uranus/4', {
                orbit: {
                    sma: 583520000,
                    ecc: 0.0014,
                    inc: 0.058,
                },
                radius: 761400,
                mass: 3.1104e21,
                axis: axis(null, 'sync'),
                albedo: 0.31,
                texture: 'data/textures/nasa/oberon.jpg',
            }),
            miranda: objdir('planet', 'Miranda', 'moon:uranus/5', {
                orbit: {
                    sma: 129390000,
                    ecc: 0.0013,
                    inc: 4.232,
                },
                radius: 235800,
                mass: 6.293e19,
                axis: axis(0, 'sync'),
                albedo: 0.32,
                texture: 'data/textures/nasa/miranda.jpg',
            }),
        }),
        neptune: objdir('planet', 'Neptune', 'planet:neptune', {
            orbit: {
                at: J2000,
                sma: 4.5e12,
                ecc: 0.008678,
                mna: 259.883,
                inc: 6.43,
                lan: 131.743,
                aop: 273.187,
            },
            radius: 24764000,
            mass: 1.02409e26,
            axis: axis(28.32, 57996, null, 299.36),
            albedo: 0.29,
            texture: 'data/textures/ssc/neptune.jpg',
        }, {
            triton: objdir('planet', 'Triton', 'moon:neptune/1', {
                orbit: {
                    sma: 354759000,
                    ecc: 0.000016,
                    inc: 156.885,
                    retrograde: true,
                },
                radius: 1353400,
                mass: 2.1389e22,
                axis: axis(0, 'sync'),
                albedo: 0.76,
                texture: 'data/textures/nasa/triton.jpg',
            }),
            nereid: objdir('planet', 'Nereid', 'moon:neptune/2', {
                orbit: {
                    at: date('2020-01-01'),
                    sma: 5.504e9,
                    ecc: 0.749,
                    mna: 318,
                    inc: 14.725,
                    lan: 326,
                    aop: 290.3,
                },
                radius: 179000,
                mass: 3.57e19,
                albedo: 0.24,
            }),
            proteus: objdir('planet', 'Proteus', 'moon:neptune/7', {
                orbit: {
                    at: date('1989-08-18'),
                    sma: 117647000,
                    ecc: 0.00053,
                    inc: 0.524,
                },
                radius: 210000,
                mass: 2.3e19,
                axis: axis(0, 'sync'),
                albedo: 0.096,
            }),
        }),
        ceres: objdir('planet', 'Ceres', 'mp:1', {
            orbit: {
                at: date('2022-01-21'),
                sma: 4.14e11,
                ecc: 0.0785,
                mna: 291.4,
                inc: 17.762,
                lan: 80.3,
                aop: 73.6,
            },
            radius: 469700,
            mass: 9.3839e20,
            axis: axis(4, 784008.288, null, 291.42744),
            albedo: 0.09,
            type: 'C',
        }),
        pallas: objdir('planet', 'Pallas', 'mp:2', {
            orbit: {
                at: date('2023-09-13'),
                sma: 414e9,
                ecc: 0.2302,
                mna: 40.6,
                lan: 172.9,
                aop: 310.9,
            },
            radius: 256000,
            mass: 2.04e20,
            axis: axis(84, 675060.48, null, null),
            albedo: 0.157,
            type: 'B',
        }),
        juno: objdir('planet', 'Juno', 'mp:3', {
            orbit: {
                at: date('2023-09-13'),
                sma: 3.99e11,
                ecc: 0.2562,
                mna: 47.02,
                inc: 12.991,
                lan: 169.84,
                aop: 247.74,
            },
            radius: 127000,
            mass: 2.7e19,
            axis: axis(null, 25956, null, 108),
            albedo: 0.22,
            type: 'S',
        }),
        vesta: objdir('planet', 'Vesta', 'mp:4', {
            orbit: {
                at: date('2023-09-13'),
                sma: 353e9,
                ecc: 0.0894,
                mna: 169.4,
                inc: 14.2972,
                lan: 103.71,
                aop: 151.66,
            },
            radius: 262700,
            mass: 2.590271e20,
            axis: axis(29, 19232.64, 308),
            albedo: 0.423,
            type: 'V',
        }),
        hygiea: objdir('planet', 'Hygiea', 'mp:10', {
            orbit: {
                at: date('2019-04-27'),
                sma: 4.699617e11,
                ecc: 0.1125,
                mna: 152.18,
                inc: 3.8316,
                lan: 283.2,
                aop: 312.32,
            },
            radius: 217000,
            mass: 8.74e19,
            axis: axis(null, 49772.124, null, null),
            albedo: 0.063,
            type: 'C',
        }),
        varuna: objdir('planet', 'Varuna', 'mp:20000', {
            orbit: {
                at: date('2020-05-31'),
                sma: 6.3905e12,
                ecc: 0.05617,
                mna: 119.121,
                inc: 17.221,
                lan: 97.372,
                aop: 262.220,
            },
            radius: 661000,
            mass: 3.698e20,
            axis: axis(null, 22836.8592, null, null),
            albedo: 0.127,
            type: 'IR',
        }),
        ixion: objdir('planet', 'Ixion', 'mp:28978', {
            orbit: {
                at: date('2020-12-17'),
                sma: 5.9543e12,
                ecc: 0.24579,
                mna: 289.587,
                inc: 19.6,
                lan: 71.011,
                aop: 298.314,
            },
            radius: 354800,
            mass: 2.8e20,
            axis: axis(null, 44640, null, null),
            albedo: 0.108,
            type: 'IR',
        }),
        quaoar: objdir('planet', 'Quaoar', 'mp:50000', {
            orbit: {
                at: date('2020-05-31'),
                sma: 6.537e12,
                ecc: 0.04106,
                mna: 301.104,
                inc: 7.9895,
                lan: 188.927,
                aop: 147.140,
            },
            radius: 545000,
            mass: 1.2e21,
            albedo: 0.124,
            type: 'IR',
        }),
        sedna: objdir('planet', 'Sedna', 'mp:90377', {
            orbit: {
                at: date('2020-05-31'),
                sma: 7.6e13,
                ecc: 0.8496,
                mna: 358.117,
                inc: 11.9307,
                lan: 114.248,
                aop: 311.352,
            },
            mass: 3e21,
            radius: 965000,
            axis: axis(null, 36982.8, null, null),
            albedo: 0.41,
            type: 'RR',
        }),
        orcus: objdir('planet', 'Orcus', 'mp:90482', {
            orbit: {
                at: date('2020-05-31'),
                sma: 5.8603e12,
                ecc: 0.22701,
                mna: 181.735,
                inc: 20.592,
                lan: 268.799,
                aop: 72.31,
            },
            radius: 917000,
            mass: 5.47e20,
            albedo: 0.231,
            type: 'BB',
        }, {
            vanth: objdir('planet', 'Vanth', 'mp:90482/1', {
                orbit: {
                    at: date('2006-09-21 12:00:00'),
                    sma: 9000000,
                    ecc: 0.00091,
                    inc: 62.793,
                    lan: 53.49,
                    aop: 274.51,
                },
                radius: 221000,
                mass: 8.7e19,
                axis: axis(null, 'sync'),
                albedo: 0.08,
            }),
        }),
        salacia: objdir('planet', 'Salacia', 'mp:120347', {
            orbit: {
                at: date('2020-05-31'),
                sma: 6.31e12,
                ecc: 0.10636,
                mna: 123.138,
                inc: 23.921,
                lan: 279.88,
                aop: 312.294,
            },
            radius: 856000,
            mass: 4.922e20,
            albedo: 0.042,
            type: 'BB',
        }),
        pluto: objdir('planet', 'Pluto', 'mp:134340', {
            orbit: {
                at: J2000,
                sma: 5.90638e12,
                ecc: 0.2488,
                mna: 14.53,
                inc: 11.88,
                lan: 110.299,
                aop: 113.834,
            },
            radius: 1188300,
            mass: 1.3025e22,
            axis: axis(122.53, 551856.672, null, 132.993),
            albedo: 0.52,
            texture: 'data/textures/nasa/pluto.jpg',
        }, {
            charon: objdir('planet', 'Charon', 'mp_moon:134340/1', {
                orbit: {
                    sma: 19595764,
                    ecc: 0.000161,
                    inc: 0.08,
                    lan: 223.046,
                },
                radius: 606000,
                mass: 1.5897e21,
                albedo: 0.35,
                texture: 'data/textures/nasa/charon.jpg',
            }),
        }),
        haumea: objdir('planet', 'Haumea', 'mp:136108', {
            orbit: {
                at: date('2020-12-17'),
                sma: 6.4501e12,
                ecc: 0.19642,
                mna: 218.205,
                lan: 122.167,
                aop: 239.041,
            },
            radius: 780000,
            mass: 4.006e21,
            axis: axis(126, 14095.2276, null, 282.6),
            albedo: 0.66,
            type: 'BB',
        }),
        eris: objdir('planet', 'Eris', 'mp:136199', {
            orbit: {
                at: date('2020-05-31'),
                sma: 1.0152e13,
                ecc: 0.43607,
                mna: 205.989,
                inc: 44.04,
                lan: 35.951,
                aop: 151.639,
            },
            radius: 1163000,
            mass: 1.638e22,
            axis: axis(78.3, 1363910.4, null, null),
            albedo: 0.96,
        }, {
            dysnomia: objdir('planet', 'Dysnomia', 'mpmoon:136199/1', {
                orbit: {
                    sma: 37273000,
                    ecc: 0.0062,
                    lan: 126.17,
                    aop: 180.83,
                },
                radius: 615000,
                mass: 8.2e19,
                albedo: 0.05,
            }),
        }),
        makemake: objdir('planet', 'Makemake', 'mp:136472', {
            orbit: {
                at: date('2020-05-31'),
                sma: 6.7962e12,
                ecc: 0.16126,
                mna: 165.514,
                inc: 28.9835,
                lan: 79.620,
                aop: 294.834,
            },
            radius: 715000,
            mass: 3.1e21,
            axis: axis(null, 1972218.24, null, null),
            albedo: 0.82,
        }),
        gonggong: objdir('planet', 'Gonggong', 'mp:225088', {
            orbit: {
                at: date('2020-12-17'),
                sma: 1.0956e13,
                ecc: 0.49943,
                mna: 106.496,
                inc: 30.6273,
                lan: 336.8573,
                aop: 207.6675,
            },
            radius: 615000,
            mass: 1.75e21,
            axis: axis(null, 80640, null, null),
            albedo: 0.14,
        }),
    }),
}));

class Preset {

    name: string;
    data: Promise<string>;

    constructor(name: string, world: World) {
        this.name = name;
        this.data = world.export();
    }

}

const presets: Preset[] = [
    new Preset('Empty', emptyWorld),
    new Preset('Solar System', solarSystemWorld),
];

export {
    emptyWorld,
    solarSystemWorld,
    Preset,
    presets,
}
