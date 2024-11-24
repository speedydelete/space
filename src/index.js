
import * as three from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

let searchInfo = [];

let timeWarp = 1;

const config = {
    G: 6.6743e-11,
    luminosityConstant: 3.2065e+30,
    rootObject: 'sun',
    startObject: 'earth',
}

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
