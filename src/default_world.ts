
import {directory, link, file, objfile} from './files';
import {World} from './world';

const defaultWorld = new World(directory({
    bin: directory(),
    boot: directory(),
    dev: directory(),
    etc: directory({
        config: file({
            tps: 20,
            c: 299792458,
            G: 6.6743e-11,
            lC: 3.2065e+30,
        }),
        time: file((new Date()).toISOString()),
    }),
    home: directory({
        root: link('/root/'),
        objects: directory({
            sun: directory({
                '.object': objfile('star', {
                    name: 'Sun',
                    mass: 1.9985e30,
                    texture: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Solarsystemscope_texture_2k_sun.jpg/800px-Solarsystemscope_texture_2k_sun.jpg',
                    magnitude: 4.83,
                    radius: 695700000,
                    flattening: 0.00005,
                    rotation: {
                        type: 'linear',
                        min: 0,
                        max: 360,
                        period: 2164320,
                        epoch: new Date(2023, 1, 1, 9, 10),
                    },
                    position: [0, 0, 0],
                    spectralType: 'G2V',
                }),
                earth: directory({
                    '.object': objfile('planet', {
                        name: 'Earth',
                        mass: 5.972168e24,
                        radius: 6378127,
                        flattening: 0.003352810681182319,
                        rotation: {
                            type: 'linear',
                            min: 0,
                            max: 360,
                            period: 86164.100352,
                            epoch: new Date(2024, 3, 20, 3, 7),
                        },
                        tilt: 23.4392811,
                        orbit: {
                            ap: 152097597000,
                            pe: 147098450000,
                            sma: 149598023000,
                            ecc: 0.0167086,
                            period: 31558149.7635,
                            inc: 7.155,
                            lan: -11.26064,
                            aop: 114.20783,
                            top: '2023-1-4'
                        },
                        texture: 'https://i.ibb.co/F7Wgjj1/2k-earth-daymap.jpg',
                    }),
                    'moon.object': objfile('planet', {
                        name: 'Moon',
                        mass: 7.346e22,
                        radius: 1738100,
                        flattening: 0.0012,
                        rotation: {
                            type: 'linear',
                            min: 0,
                            max: 360,
                            period: 2360591.5104,
                            epoch: new Date(2024, 12, 1, 1, 21),
                        },
                        orbit: {
                            ap: 405400000,
                            pe: 362600000,
                            sma: 384399000,
                            ecc: 0.0549,
                            period: 2360591.5104,
                            inc: 5.145,
                            lan: 0,
                            aop: 0,
                            top: new Date(2024, 11, 14, 11, 18),
                        },
                        texture: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/lroc_color_poles_1k.jpg',
                    }),
                }),
            }),
        }),
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
}));

export {
    defaultWorld,
}
