
import * as three from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

// const objects = [
//     {
//         "name": "sun",
//         "type": "star",
//         "color": "0xfff5ec",
//         "texture": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Solarsystemscope_texture_2k_sun.jpg/800px-Solarsystemscope_texture_2k_sun.jpg",
//         "mag": 4.83,
//         "radius": 695700000,
//         "flattening": 0.00005,
//         "mass": 1.9985e30,
//         "rotationPeriod": 2164320,
//         "children": [
//             {
//                 "name": "earth",
//                 "type": "planet",
//                 "texture": "https://i.ibb.co/F7Wgjj1/2k-earth-daymap.jpg",
//                 "radius": 6378127,
//                 "flattening": 0.003352810681182319,
//                 "orbit": {
//                     "ap": 152097597000,
//                     "pe": 147098450000,
//                     "sma": 149598023000,
//                     "ecc": 0.0167086,
//                     "inc": 7.155,
//                     "lan": -11.26064,
//                     "aop": 114.20783,
//                     "top": "2023-1-4"
//                 },
//                 "children": [
//                     {
//                         "name": "moon",
//                         "type": "planet",
//                         "texture": "https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/lroc_color_poles_1k.jpg",
//                         "radius": 1738100,
//                         "flattening": 0.0012,
//                         "orbit": {
//                             "ap": 405400000,
//                             "pe": 362600000,
//                             "sma": 384399000,
//                             "ecc": 0.0549,
//                             "inc": 5.145,
//                             "lan": 0,
//                             "aop": 0
//                         }
//                     }
//                 ]
//             }
//         ]
//     }
// ]

let searchInfo = [];

const config = {
    G: 6.6743e-11,
    luminosityConstant: 3.2065e+30,
    rootObject: 'sun',
    startObject: 'earth',
}

function rotateVector(vec, angle, axis) {
    const [x, y, z] = vec;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    if (axis === 'x') {
        return [
            x,
            y * cosA - z * sinA,
            y * sinA + z * cosA
        ];
    } else if (axis === 'y') {
        return [
            x * cosA + z * sinA,
            y,
            -x * sinA + z * cosA
        ];
    } else if (axis === 'z') {
        return [
            x * cosA - y * sinA,
            x * sinA + y * cosA,
            z
        ];
    }
    return vec;
}

function getAnomalies(object, parent, time, tol=1e-6) {
    const ecc = object.orbit.ecc;
    const meanA = config.G*(object.mass + parent.mass)*((time.getTime() - object.orbit.top.getTime())/1000);
    let eccA = meanA;
    let delta;
    do {
        delta = eccA - ecc * Math.sin(eccA) - meanA;
        eccA -= delta / (1 - ecc * Math.cos(eccA));
    } while (Math.abs(delta) > tol);
    const trueA = 2 * Math.atan2(
        Math.sqrt(1 + ecc) * Math.sin(eccA / 2),
        Math.sqrt(1 - ecc) * Math.cos(eccA / 2)
    );
    return {
        mean: meanA,
        ecc: eccA,
        true: trueA,
    };
}

function getRadius(orbit, anomalies) {
    return (orbit.sma * (1 - orbit.ecc**2))/(1 + orbit.ecc*Math.cos(anomalies.mean));
}

function getPosition(object, parent, time, tol=1e-6) {
    const anomalies = getAnomalies(object, parent, time, tol);
    const radius = getRadius(object.orbit, anomalies);
    let vec = [radius * Math.cos(anomalies.true), radius * Math.sin(anomalies.true), 0];
    vec = rotateVector(vec, -object.orbit.pe, 'z');
    vec = rotateVector(vec, -object.orbit.inc, 'x');
    vec = rotateVector(vec, -object.orbit.lan, 'z');
    return vec;
}

let timeWarp = 1;

const renderer = new three.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new three.Scene();

const camera = new three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.000000001, 100000000000000);

const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 0.0000000000001;
controls.maxDistance = 1000000000000000;
controls.keys = {
    LEFT: 'ArrowLeft',
    UP: 'ArrowUp',
    RIGHT: 'ArrowRight',
    BOTTOM: 'ArrowDown',
}
controls.keyPanSpeed = 2;
controls.update();
controls.listenToKeyEvents(window);

const ambientLight = new three.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const textureLoader = new three.TextureLoader();

function addObject(object, pos = [0, 0, 0], root = true) {
    if (typeof object.color == 'string') object.color = parseInt(object.color);
    if (!(root)) {
        pos[2] += object.orbit.ap;
    }
    let material;
    if (object.texture) {
        material = new three.MeshStandardMaterial({map: textureLoader.load(object.texture)});
    }
    if (object.type == 'star') {
        material.emissiveMap = textureLoader.load(object.texture);
        material.emissive = new three.Color().setRGB(
            Math.floor(object.color / 65536)/255,
            Math.floor((object.color % 65536) / 256)/255,
            Math.floor(object.color % 256)/256
        );
        material.emissiveIntensity = 2;
    }
    const geometry = new three.SphereGeometry(object.radius, 512, 512);
    const mesh = new three.Mesh(geometry, material);
    mesh.position.set(...pos);
    if (object.type == 'star') {
        const light = new three.PointLight(object.color);
        light.power = config.luminosityConstant / 10**(0.4 * object.mag);
        light.power /= 20000; // hotfix
        mesh.add(light);
    }
    scene.add(mesh);
    object.mesh = mesh;
    if (object.children) {
        for (let i = 0; i < object.children.length; i++) {
            object.children[i] = addObject(object.children[i], pos.slice(), false);
        }
    }
    return object;
}

function animate() {
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('load', async function() {
    const objects = await (await fetch('objects.json')).json();
    for (let i = 0; i < objects.length; i++) {
        objects[i] = addObject(objects[i]);
    }    
    controls.target.copy(objects[0].children[0].mesh.position);
    controls.update();
    renderer.setAnimationLoop(animate);
});
