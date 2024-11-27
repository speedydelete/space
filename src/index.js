
import * as three from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {formatLength} from './units.js';
import {getObjectCount, loadObjects} from './object_loader.js';
import * as updaters from './updaters.js';

const debugElt = document.getElementById('debug-info');

let searchInfo = [];

let timeWarp = 864;

const renderer = new three.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new three.Scene();

const camera = new three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.000000001, 100000000000000);

const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 0.0000000000001;
controls.maxDistance = 1000000000000000;
controls.keys = {LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', BOTTOM: 'ArrowDown'}
controls.keyPanSpeed = 2;
controls.update();
controls.listenToKeyEvents(window);

const ambientLight = new three.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

let frames = 0;
let prevTime = performance.now();
let fps = 60;

// window.addEventListener('resize', () => {
//     camera.aspect = window.innerWidth / window.innerHeight;
//     camera.updateProjectionMatrix();
//     renderer.setSize(window.innerWidth, window.innerHeight);
// });

camera.position.z = 5;

function animate(objects) {
    frames++;
    const time = performance.now();
    if ( time >= prevTime + 1000 ) {
    	fps = Math.round((frames * 1000)/( time - prevTime));
        frames = 0;
        prevTime = time;
        debugElt.innerText = `FPS: ${fps}
        X: ${formatLength(camera.position.x)}
        Y: ${formatLength(camera.position.y)}
        Z: ${formatLength(camera.position.z)}
        Time Warp: ${timeWarp} sec/sec
        Objects: ${getObjectCount(objects)}`;
    }
    controls.update();
    if (fps != 0) updaters.rotateObjects(objects, timeWarp / fps);
    renderer.render(scene, camera);
}

const objects = await loadObjects(scene);
controls.target.copy(objects[0].children[0].mesh.position);
controls.update();
// requestAnimationFrame(() => animate(objects));
setInterval(animate, 30, objects);
