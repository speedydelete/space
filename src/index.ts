alert('hi');

import * as three from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {formatTime, formatLength} from './util.ts';
import {type World, defaultWorld} from './world.ts';
import {getPosition} from './orbits.ts';

const unitSize: number = 6371000; // settings.unitSize;

const leftInfoElt: HTMLElement | null = document.getElementById('left-info');
const rightInfoElt: HTMLElement | null = document.getElementById('right-info');

let time: Date = new Date();
let target: string = 'sun.earth';
let timeWarp: number = 1;

const renderer: three.WebGLRenderer = new three.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene: three.Scene = new three.Scene();

const camera: three.PerspectiveCamera = new three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.0000000000001, 100000000000000);

const controls: three.OrbitControls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 0.0000000000001;
controls.maxDistance = 100000000000000;
controls.keys = {LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', BOTTOM: 'ArrowDown'}
controls.keyPanSpeed = 2;
controls.update();
controls.listenToKeyEvents(window);

const ambientLight = new three.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const raycaster: three.Raycaster = new three.Raycaster();

window.addEventListener('click', function(event) {
    raycaster.setFromCamera(new three.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1), camera);
    const intersects: three.Object3D[] = raycaster.intersectObjects(Object.values(objectMap).map((x) => x.mesh));
    if (intersects.length > 0) {
        target = intersects[0].object.name;
        controls.target.copy(intersects[0].object.position);
    }
});

window.addEventListener('keypress', function(event) {
    if (event.key == ',') {
        if (Math.log10(timeWarp) % 1 === 0) {
            timeWarp /= 2;
        } else {
            timeWarp /= 5;
        }
    } else if (event.key == '.') {
        if (Math.log10(timeWarp) % 1 === 0) {
            timeWarp *= 5;
        } else {
            timeWarp *= 2;
        }
    } else if (event.key == '/') {
        timeWarp = 1;
    }
});

function loadObjects(world: World, dir: string = '/home/objects'): void {
    for (const filename in world.ls(dir)) {
        const filepath = world.join(dir, filename);
        if (filename.endsWith('.object')) {
            const object = world.readJSON(filepath);
            let material;
            if (object.texture) {
                material = new three.MeshStandardMaterial({map: textureLoader.load(object.texture)});
                material.opacity = 1;
                material.transparent = true;
            }
            if (object.type == 'star') {
                material.emissiveMap = textureLoader.load(object.texture);
                let color = object.color;
                if (type(color) == 'string') color = parseInt(color);
                material.emissive = new three.Color().setRGB(
                    Math.floor(object.color / 65536)/255,
                    Math.floor((object.color % 65536) / 256)/255,
                    Math.floor(object.color % 256)/256
                );
                material.emissiveIntensity = 2;
            }
            const geometry = new three.SphereGeometry(object.radius/settings.unitSize, 512, 512);
            const mesh = new three.Mesh(geometry, material);
            mesh.opacity = 1;
            mesh.transparent = true;
            mesh.position.set(...pos);
            if (object.type == 'star') {
                const light = new three.PointLight(object.color);
                light.power = settings.luminosityConstant / 10**(0.4 * object.mag) / settings.unitSize**2 / 20000;
                console.log(light.power);
                mesh.add(light);
            }
            mesh.visible = true;
            scene.add(mesh);
            object.mesh = meshl
        } else {
            loadObjects(scene, filepath);
        }
    }
}

let frames: number = 0;
let prevRealTime: number = performance.now();
let fps: number = 60;

function rotateObjects(objects: Object[]) {
    for (const object of world.getAllObjects()) {
        if (object.rotation) object.mesh.rotation.y = (timeDiff(time, object.rotation.epoch)/object.rotation.period*Math.PI) % Math.PI;
        if (object.children) object.children = rotateObjects(object.children, time);
    }
    return world;
}

function moveObjects(world: World, objects, time, parent = null) {
    for (const object of objects) {
        if (parent !== null) {
            const [z, x, y] = getPosition(object, time);
            const [px, py, pz] = parent.mesh.position;
            object.mesh.position.set(px + x, py + y, pz + z);
        }
        if (object.children) moveObjects(object.children, time, object);
    }
}

export {
    rotateObjects,
    moveObjects,
}


function animate(world: World): void {
    if (document.hidden || document.visibilityState == 'hidden') return;
    frames++;
    const realTime = performance.now();
    if (realTime >= prevRealTime + 1000) {
    	fps = Math.round((frames * 1000)/(realTime - prevRealTime));
        frames = 0;
        prevRealTime = realTime;
    }
    const targetObj: Object = objectMap[target];
    leftInfoElt.innerText = `FPS: ${fps}
    Camera X: ${formatLength(camera.position.x*unitSize)}
    Camera Y: ${formatLength(camera.position.y*unitSize)}
    Camera Z: ${formatLength(camera.position.z*unitSize)}
    Total Objects: ${getObjectCount(objects)}
    Time: ${new Date().toISOString()}
    Time Warp: ${timeWarp}x (${formatTime(timeWarp)}/s)`;
    rightInfoElt.innerText = `ID: ${target}
    Name: ${targetObj.name}
    X: ${formatLength(targetObj.mesh.position.x*config.unitSize)}
    Y: ${formatLength(targetObj.mesh.position.y*unitSize)}
    Z: ${formatLength(targetObj.mesh.position.z*unitSize)}\n` + (targetObj.orbit ? `\tApoapsis: ${formatLength(targetObj.orbit.ap)}
    \tPeriapsis: ${formatLength(targetObj.orbit.pe)}
    \tSemi-major Axis: ${formatLength(targetObj.orbit.sma)}
    \tEccentricity: ${targetObj.orbit.ecc}
    \tPeriod: ${formatTime(targetObj.orbit.period)}
    \tInclination: ${targetObj.orbit.inc}°
    \tLongitude of Ascending Node: ${targetObj.orbit.lan}°
    \tArgument of Periapsis: ${targetObj.orbit.aop}°
    \tTime of Periapsis: ${targetObj.orbit.top}`
    : `No orbit, root object`);
    time.setTime(time.getTime() + 1000 * timeWarp / fps);
    if (fps != 0) {
        const objects = world.read('/home/objects');
        updaters.rotateObjects(objects, time);
        updaters.moveObjects(objects, time);
        const [oldX, oldY, oldZ] = targetObj.mesh.position;
        controls.target.copy(targetObj.mesh.position);
        const [newX, newY, newZ] = targetObj.mesh.position;
        camera.position.x += newX - oldX;
        camera.position.y += newY - oldY;
        camera.position.z += newZ - oldZ;
    }
    camera.updateProjectionMatrix();
    controls.update();
    renderer.render(scene, camera);
}

const world: World = defaultWorld;
loadObjects(world);
renderer.setAnimationLoop(() => animate(world));
setTimeout(() => {
    const targetPos: three.Vector3 = objectMap[target].mesh.position;
    camera.position.set(targetPos.x + objectMap[target].radius/config.unitSize*10, targetPos.y, targetPos.z);
}, 1000);
