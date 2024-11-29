
import * as three from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {config} from './config.js';
import {formatTime, formatLength} from './units.js';
import {getObjectCount, loadObjects, getObjectMap} from './object_loader.js';
import * as updaters from './updaters.js';

const {unitSize} = config;

const debugElt = document.getElementById('debug-info');

let time = new Date('2023-01-04');
let target = 'sun.earth';
let timeWarp = 1;

const renderer = new three.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new three.Scene();

const camera = new three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.0000000000001, 100000000000000);

const controls = new OrbitControls(camera, renderer.domElement);
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

const raycaster = new three.Raycaster();

window.addEventListener('click', function(event) {
    raycaster.setFromCamera(new three.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1), camera);
    const intersects = raycaster.intersectObjects(Object.values(objectMap).map((x) => x.mesh));
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
    }
});


let frames = 0;
let prevRealTime = performance.now();
let fps = 60;

function animate(objects) {
    if (document.hidden || document.visibilityState == 'hidden') return;
    frames++;
    const realTime = performance.now();
    if (realTime >= prevRealTime + 1000) {
    	fps = Math.round((frames * 1000)/(realTime - prevRealTime));
        frames = 0;
        prevRealTime = realTime;
    }
    const [cx, cy, cz] = camera.position;
    const [tx, ty, tz] = objectMap[target].mesh.position;
    debugElt.innerText = `FPS: ${fps}
    Camera: X: ${formatLength(cx*unitSize)}, Y: ${formatLength(cy*unitSize)}, Z: ${formatLength(cz*unitSize)}
    Target: ID: ${target}, X: ${formatLength(tx*config.unitSize)}, Y: ${formatLength(ty*unitSize)}, Z: ${formatLength(tz*unitSize)}
    Time Warp: ${timeWarp}x (${formatTime(timeWarp)}/s)
    Objects: ${getObjectCount(objects)}`;
    time.setTime(time.getTime() + 1000 * timeWarp / fps);
    if (fps != 0) {
        updaters.rotateObjects(objects, timeWarp / fps);
        updaters.moveObjects(objects, time);
        controls.target.copy(objectMap[target].mesh.position);
        const [newX, newY, newZ] = objectMap[target].mesh.position;
        camera.position.x += newX - tx;
        camera.position.y += newY - ty;
        camera.position.z += newZ - tz;
    }
    camera.updateProjectionMatrix();
    controls.update();
    renderer.render(scene, camera);
}

const objects = await loadObjects(scene);
const objectMap = getObjectMap(objects);
console.log(objectMap);
controls.update();
renderer.setAnimationLoop(() => animate(objects));
setTimeout(() => {
    const targetPos = objectMap[target].mesh.position;
    camera.position.set(targetPos.x + objectMap[target].radius/config.unitSize*10, targetPos.y, targetPos.z);
}, 1000);
