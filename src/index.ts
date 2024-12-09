import * as three from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import type {Position, Obj} from './types.ts';
import {formatTime, formatLength} from './util.ts';
import {join, type World, defaultWorld, resolveValue} from './world.ts';
import {getPosition} from './orbits.ts';

const world: World = defaultWorld;

const unitSize: number = 150000000000;

let target: string = 'sun/earth';
let timeWarp: number = 1;

const renderer: three.WebGLRenderer = new three.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene: three.Scene = new three.Scene();

const camera: three.PerspectiveCamera = new three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.0000000000001, 100000000000000);

const controls: OrbitControls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 0.0000000000001;
controls.maxDistance = 100000000000000;
controls.keys = {LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', BOTTOM: 'ArrowDown'}
controls.keyPanSpeed = 2;
controls.update();
controls.listenToKeyEvents(window);

scene.add(new three.AmbientLight(0xffffff, 0.2));

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
    const intersects = raycaster.intersectObjects(Object.values(world.objectMeshes));
    if (intersects.length > 0) {
        target = Object.entries(world.objectMeshes).filter((x) => x[1] == intersects[0].object)[0][0];
        controls.target.copy(intersects[0].object.position);
    }
});

const changelogElt = document.getElementById('changelog');
let changelogShown = false;

window.addEventListener('keypress', function(event) {
    if (event.key == ',') {
        event.preventDefault();
        if (Math.log10(timeWarp) % 1 === 0) {
            timeWarp /= 2;
        } else {
            timeWarp /= 5;
        }
    } else if (event.key == '.') {
        event.preventDefault();
        if (Math.log10(timeWarp) % 1 === 0) {
            timeWarp *= 5;
        } else {
            timeWarp *= 2;
        }
    } else if (event.key == '/') {
        event.preventDefault();
        timeWarp = 1;
    } else if (event.key == 'c' && changelogElt) {
        event.preventDefault();
        changelogShown = !changelogShown;
        if (changelogShown) {
            changelogElt.style.display = 'block';
            document.body.removeChild(renderer.domElement);
            if (leftInfoElt) leftInfoElt.style.display = 'none';
            if (rightInfoElt) rightInfoElt.style.display = 'none';
        } else {
            changelogElt.style.display = 'none';
            document.body.appendChild(renderer.domElement);
            if (leftInfoElt) leftInfoElt.style.display = 'block';
            if (rightInfoElt) rightInfoElt.style.display = 'block';
        }
    }
});

const textureLoader = new three.TextureLoader()

function loadObjects(): void {
    for (const path of world.lsobjall()) {
        const object = world.getobj(path);
        if (object === undefined) continue;
        let material = new three.MeshStandardMaterial();
        if (object.texture) {
            material.map = textureLoader.load(object.texture);
        }
        material.opacity = 1;
        material.transparent = true;
        if (object.type == 'star') {
            if (material.map) material.emissiveMap = material.map;
            material.emissive = new three.Color(object.color);
            material.emissiveIntensity = 2;
        }
        const geometry = new three.SphereGeometry(object.radius/unitSize, 512, 512);
        const mesh = new three.Mesh(geometry, material);
        mesh.position.set(...object.position);
        if (object.type == 'star') {
            const light = new three.PointLight(object.color);
            light.power = world.config.lC / 10**(0.4 * object.magnitude) / unitSize**2 / 20000;
            light.castShadow = true;
            mesh.add(light);
        }
        mesh.visible = true;
        scene.add(mesh);
        world.setObjectMesh(path, mesh);
    }
}

function rotateObjects(): void {
    for (const path of world.lsobjall()) {
        const mesh = world.getObjectMesh(path);
        const object = world.getobj(path);
        if (mesh !== undefined && object !== undefined) {
            mesh.rotation.set(0, 0, 0);
            mesh.rotateX(object.tilt * Math.PI / 180);
            mesh.rotateY(resolveValue(object.rotation, world) * Math.PI / 180);
        }
    }
}

function moveObjects(basePath: string = '', parentPos: Position = [0, 0, 0]): void {
    for (const filename of world.lsobj(basePath)) {
        const path = join(basePath, filename);
        const object = world.getobj(path);
        const mesh = world.getObjectMesh(path);
        if (object !== undefined && mesh !== undefined) {
            let [z, x, y] = getPosition(world, object);
            x += parentPos[0];
            y += parentPos[1];
            z += parentPos[2];
            mesh.position.set(x/unitSize, y/unitSize, z/unitSize);
            if (world.isdirobj(path)) {
                moveObjects(path, [x, y, z]);
            }
        }
    }
}

let frames: number = 0;
let prevRealTime: number = performance.now();
let fps: number = 60;

const leftInfoElt: HTMLElement | null = document.getElementById('left-info');
const rightInfoElt: HTMLElement | null = document.getElementById('right-info');

function animate(): void {
    if (document.hidden || document.visibilityState == 'hidden') return;
    frames++;
    const realTime = performance.now();
    if (realTime >= prevRealTime + 1000) {
    	fps = Math.round((frames * 1000)/(realTime - prevRealTime));
        frames = 0;
        prevRealTime = realTime;
    }
    const targetObj: Obj | undefined = world.getobj(target);
    const mesh: three.Mesh | undefined = world.getObjectMesh(target);
    if (leftInfoElt) {
        leftInfoElt.innerText = `FPS: ${fps}
        Camera X: ${formatLength(camera.position.x*unitSize)}
        Camera Y: ${formatLength(camera.position.y*unitSize)}
        Camera Z: ${formatLength(camera.position.z*unitSize)}
        Total Objects: ${world.lsobjall().length}
        Time: ${world.time?.toISOString()}
        Time Warp: ${timeWarp}x (${formatTime(timeWarp)}/s)
        Press C for changelog.
        Use ,./ to control time warp.
        Click on objects to select them.`;
    }
    if (rightInfoElt && targetObj !== undefined && mesh !== undefined) {
        rightInfoElt.innerText = `Path: ${target}
        Name: ${targetObj.name}
        X: ${formatLength(mesh.position.x*unitSize)}
        Y: ${formatLength(mesh.position.y*unitSize)}
        Z: ${formatLength(mesh.position.z*unitSize)}\n` + (targetObj.orbit ? `\tApoapsis: ${formatLength(targetObj.orbit.ap)}
        \tPeriapsis: ${formatLength(targetObj.orbit.pe)}
        \tSemi-major Axis: ${formatLength(targetObj.orbit.sma)}
        \tEccentricity: ${targetObj.orbit.ecc}
        \tPeriod: ${formatTime(targetObj.orbit.period)}
        \tInclination: ${targetObj.orbit.inc}\xb0
        \tLongitude of Ascending Node: ${targetObj.orbit.lan}\xb0
        \tArgument of Periapsis: ${targetObj.orbit.aop}\xb0
        \tTime of Periapsis: ${targetObj.orbit.top}`
        : `No orbit, root object`);
    }
    if (fps != 0) {
        if (world.time) {
            world.time = new Date(world.time.getTime() + 1000 * timeWarp / fps);
        }
        if (mesh !== undefined) {
            const [oldX, oldY, oldZ] = mesh.position;
            moveObjects();
            rotateObjects();
            controls.target.copy(mesh.position);
            const [newX, newY, newZ] = mesh.position;
            camera.position.x += newX - oldX;
            camera.position.y += newY - oldY;
            camera.position.z += newZ - oldZ;
        } else {
            moveObjects();
            rotateObjects();
        }
    }
    camera.updateProjectionMatrix();
    controls.update();
    renderer.render(scene, camera);
}

loadObjects();
setTimeout(() => {
    const object = world.getobj(target);
    const mesh = world.getObjectMesh(target);
    if (object && mesh) {
        camera.position.set(mesh.position.x + object.radius/unitSize*10, mesh.position.y, mesh.position.z);
    }
}, 1000);
renderer.setAnimationLoop(animate);
