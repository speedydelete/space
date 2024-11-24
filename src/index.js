
import * as three from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {loadObjects} from './object_loader.js';

let searchInfo = [];

let timeWarp = 1;

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

function animate() {
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('load', async function() {
    const objects = await loadObjects(scene);
    controls.target.copy(objects[0].children[0].mesh.position);
    controls.update();
    renderer.setAnimationLoop(animate);
});
