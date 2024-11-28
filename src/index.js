
import * as three from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {config} from './config.js';
import {formatLength} from './units.js';
import {getObjectCount, loadObjects, getObjectMap} from './object_loader.js';
import * as updaters from './updaters.js';

const debugElt = document.getElementById('debug-info');

let currentTime = new Date('2023-01-04');
let target = 'sun.earth';
let timeWarp = 864;

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

let frames = 0;
let prevTime = performance.now();
let fps = 60;

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

function animate(objects) {
    if (document.hidden) return;
    frames++;
    const time = performance.now();
    if ( time >= prevTime + 1000 ) {
    	fps = Math.round((frames * 1000)/( time - prevTime));
        frames = 0;
        prevTime = time;
        debugElt.innerText = `FPS: ${fps}
        CX: ${formatLength(camera.position.x*config.unitSize)}
        CY: ${formatLength(camera.position.y*config.unitSize)}
        CZ: ${formatLength(camera.position.z*config.unitSize)}
        Target: ${target}
        TX: ${formatLength(objectMap[target].mesh.position.x*config.unitSize)}
        TY: ${formatLength(objectMap[target].mesh.position.y*config.unitSize)}
        TZ: ${formatLength(objectMap[target].mesh.position.z*config.unitSize)}
        Time Warp: ${timeWarp} s/s
        Objects: ${getObjectCount(objects)}`;
    }
    currentTime.setTime(currentTime.getTime() + 1000 * timeWarp / fps);
    if (fps != 0) {
        updaters.rotateObjects(objects, timeWarp / fps);
        updaters.moveObjects(objects, currentTime);
        controls.target.copy(objectMap[target].mesh.position);
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
    camera.position.set(targetPos.x - objectMap[target].radius*2/config.unitSize, targetPos.y, targetPos.z);
}, 1000);
