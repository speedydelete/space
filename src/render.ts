
import * as three from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import * as units from './format';
import {Obj, RootObj} from './obj';
import presets from './presets';
import renderBGStars from './bg_stars';


export interface Settings {
    fov: number,
    renderDistance: number,
    unitSize: number,
    cameraMinDistance: number,
    cameraMaxDistance: number,
    controlsMinDistance: number,
    controlsMaxDistance: number,
}

export const DEFAULT_SETTINGS: Settings = {
    fov: 70,
    renderDistance: 150000000000,
    unitSize: 1000000,
    cameraMinDistance: 0.0000001,
    cameraMaxDistance: 1000000000000,
    controlsMinDistance: 0.00001,
    controlsMaxDistance: Number.MAX_SAFE_INTEGER,
}

const HELP_MESSAGE = `Use the "[" and "]" keys to select different objects, or just click on an object.
Use the "," and "." keys to control the time warp, and use the "/" key to reset it.
Use the "+" and "-" keys to do telescopic zoom, and use Shift-+ to reset it.`;


let world = presets.default;
Object.assign(globalThis, {
    world,
    system: world.system,
    fs: world.fs,
    objDir: world.objDir,
    getObj: world.getObj.bind(world),
    setObj: world.setObj.bind(world),
});

let settings = DEFAULT_SETTINGS;
let unitSize = settings.unitSize;

let objMeshes: {[key: string]: three.Mesh} = {};

let target = world.config.initialTarget;
let zoom = 1;

let renderer = new three.WebGLRenderer({
    precision: 'highp',
    alpha: true,
    logarithmicDepthBuffer: true,
});
renderer.setSize(window.innerWidth, window.innerHeight - 30);
document.getElementById('game')?.insertBefore(renderer.domElement, document.getElementById('info-bar'));

let scene = new three.Scene();
scene.add(new three.AmbientLight(0xffffff, 0.2));

let camera = new three.PerspectiveCamera(
    settings.fov,
    window.innerWidth/(window.innerHeight - 30),
    settings.cameraMinDistance/unitSize,
    settings.cameraMaxDistance/unitSize,
);

let controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = settings.controlsMinDistance/unitSize;
controls.maxDistance = settings.controlsMaxDistance/unitSize;
controls.keys = {LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', BOTTOM: 'ArrowDown'}
controls.keyPanSpeed = 2;
controls.update();
controls.listenToKeyEvents(window);


function getObjMesh(path: string): three.Mesh | undefined {
    if (path.startsWith('/')) path = path.slice(1);
    return objMeshes[path];
}


let textureLoader = new three.TextureLoader();
for (let path of world.getObjPaths('', true)) {
    let object = world.getObj(path);
    if (object === undefined || object instanceof RootObj) continue;
    let material = new three.MeshStandardMaterial();
    if (object.texture) {
        material.map = textureLoader.load(object.texture);
    }
    material.opacity = 1;
    material.transparent = true;
    if (object.albedo) {
        material.color = new three.Color(object.albedo, object.albedo, object.albedo);
    }
    if (object.type === 'star') {
        if (material.map) material.emissiveMap = material.map;
        material.emissive = new three.Color(object.color);
        material.emissiveIntensity = 10;
    }
    let geometry = new three.SphereGeometry(object.radius/unitSize, 512, 512);
    let mesh = new three.Mesh(geometry, material);
    let [x, y, z] = object.position;
    mesh.position.set(x/unitSize, y/unitSize, z/unitSize);
    if (object.type === 'star') {
        let light = new three.PointLight(object.color);
        light.power = world.config.lC / 10**(0.4 * object.magnitude) / unitSize**2 / 5000;
        light.castShadow = true;
        mesh.add(light);
    }
    mesh.material.side = three.FrontSide;
    mesh.visible = true;
    scene.add(mesh);
    objMeshes[path] = mesh;
}

function updateObjects(): number {
    let renderedObjects = 0;
    for (let path of world.getObjPaths('', true)) {
        let object = world.getObj(path);
        let mesh = getObjMesh(path);
        if (object !== undefined && mesh !== undefined && (object.alwaysVisible || mesh.position.distanceTo(camera.position) < settings.renderDistance/settings.unitSize)) {
            let [x, y, z] = object.position;
            mesh.position.set(x/unitSize, y/unitSize, z/unitSize);
            mesh.rotation.set(0, 0, 0);
            if (object.axis) {
                mesh.rotateX(object.axis.tilt * Math.PI / 180);
                if (object.axis.epoch !== null) {
                    if (object.axis.period === 'sync') {
                        console.error('period is sync for', object, 'path:', path);
                    } else {
                        mesh.rotateY(((world.time - object.axis.epoch)/object.axis.period % 1) * Math.PI * 2);
                    }
                }
            }
            renderedObjects += 1;
            mesh.visible = true;
        } else if (mesh) {
            mesh.visible = false;
        }
    }
    return renderedObjects;
}


function handleResize(): void {
    camera.aspect = window.innerWidth / (window.innerHeight - 30);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight - 30);
}

let raycaster = new three.Raycaster();

function handleDoubleClick(event: MouseEvent): void {
    raycaster.setFromCamera(new three.Vector2((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1), camera);
    let intersects = raycaster.intersectObjects(Object.values(objMeshes));
    if (intersects.length > 0) {
        target = Object.entries(objMeshes).filter((x) => x[1] === intersects[0].object)[0][0];
        controls.target.copy(intersects[0].object.position);
    }
}

let showDebug = true;

async function handleKeyDown(event: KeyboardEvent): Promise<void> {
    if (event.key === ',') {
        if (Math.log10(world.timeWarp) % 1 === 0) {
            world.timeWarp /= 2;
        } else {
            world.timeWarp /= 5;
        }
    } else if (event.key === '.') {
        if (Math.log10(world.timeWarp) % 1 === 0) {
            world.timeWarp *= 5;
        } else {
            world.timeWarp *= 2;
        }
    } else if (event.key === '/') {
        event.preventDefault();
        world.timeWarp = 1;
    } else if (event.key === '=' || event.key === '+') {
        if (event.shiftKey) {
            zoom = 1;
        } else {
            zoom += 10**Math.floor(Math.log10(zoom));
        }
    } else if (event.key === '-') {
        let logZoom = Math.log10(zoom);
        let floorLogZoom = Math.floor(logZoom);
        // Prevent issue of zooming in too far (zoom <= 1e-31) and can't zoom out.
        // Use .11 instead of .1 to compensate for floating point error
        if (zoom >= .11) {
            if (logZoom === Math.floor(logZoom)) {
                zoom -= 10**(floorLogZoom - 1);
            } else {
                zoom -= 10**floorLogZoom;
            }
        }
    } else if (event.key === '[') {
        let allObjects = world.getObjPaths('', true);
        // Do all wraparound index logic in one line
        // The formula is ((unboundedIndex % length) + length) % length
        let index = (((allObjects.indexOf(target) - 1) % allObjects.length) + allObjects.length) % allObjects.length;

        target = allObjects[index];
    } else if (event.key === ']') {
        let allObjects = world.getObjPaths('', true);
        // Do all wraparound index logic in one line
        // The formula is ((unboundedIndex % length) + length) % length
        let index = (((allObjects.indexOf(target) + 1) % allObjects.length) + allObjects.length) % allObjects.length;

        target = allObjects[index];
    } else if (event.key === 'Escape') {
    } else if (event.key === 'i') {
        camera.position.x += 100/unitSize;
    } else if (event.key === 'k') {
        camera.position.x -= 100/unitSize;
    } else if (event.key === 'j') {
        camera.position.z -= 100/unitSize;
    } else if (event.key === 'l') {
        camera.position.z += 100/unitSize;
    } else if (event.key === 'h') {
        if (event.shiftKey) {
            alert(HELP_MESSAGE);
        } else {
            camera.position.y += 100/unitSize;
        }
    } else if (event.key === 'n') {
        camera.position.y -= 100/unitSize;
    }
}


let leftInfoElt = document.getElementById('left-info') as HTMLDivElement;
let rightInfoElt = document.getElementById('right-info') as HTMLDivElement;

let timeElt = document.getElementById('time') as HTMLSpanElement;

let blurred = false;
let frames = 0;
let prevRealTime = performance.now();
let oldMeshPos = new three.Vector3(0, 0, 0);
let fps = parseInt(localStorage['space-fps'] ?? '60');

const e = 23.439 * Math.PI / 180;
const {sin, cos, tan, asin, atan2, PI: pi} = Math;

function animate(): void {
    let renderedObjects = updateObjects();
    if (document.hidden || document.visibilityState === 'hidden') {
        blurred = true;
        requestAnimationFrame(animate);
        return;
    } else if (blurred) {
        blurred = false;
        frames = 0;
        prevRealTime = performance.now();
        fps = parseInt(localStorage['space-fps']);
    }
    frames++;
    let realTime = performance.now();
    if (realTime >= prevRealTime + 1000) {
        fps = Math.round((frames * 1000)/(realTime - prevRealTime));
        frames = 0;
        prevRealTime = realTime;
        localStorage['space-fps'] = fps;
    }
    let targetObj: Obj | undefined = world.getObj(target);
    let mesh: three.Mesh | undefined = getObjMesh(target);
    if (mesh && mesh.position) {
        camera.position.x += mesh.position.x - oldMeshPos.x;
        camera.position.y += mesh.position.y - oldMeshPos.y;
        camera.position.z += mesh.position.z - oldMeshPos.z;
        controls.target.copy(mesh.position);
    }
    let direction = new three.Vector3();
    camera.getWorldDirection(direction);
    let b = asin(direction.y);
    let l = atan2(direction.z, direction.x);
    let ra = atan2(sin(l)*cos(e) - tan(b)*sin(e), cos(l)) * 180/pi + 180;
    let dec = asin(sin(b)*cos(e) + cos(b)*sin(e)*sin(l)) * 180/pi;
    timeElt.textContent = units.formatDate(world.time);
    if (showDebug) {
        console.log('yes');
        leftInfoElt.innerText = `FPS: ${fps}
        Camera: ${units.formatLength(camera.position.x*unitSize)} / ${units.formatLength(camera.position.y*unitSize)} / ${units.formatLength(camera.position.z*unitSize)}
        Telescopic Zoom: ${Math.round(zoom*10)/10}
        Objects: ${renderedObjects}/${world.getObjPaths('', true).length}
        RA: ${ra.toFixed(3)}°, Dec: ${dec.toFixed(3)}°
        Time: ${world.time ? units.formatDate(world.time) : 'undefined'}
        Time Warp: ${world.timeWarp}x (${units.formatTime(world.timeWarp)}/s)
        Press Shift-H for help.`;
        if (targetObj !== undefined && mesh !== undefined) {
            rightInfoElt.innerText = `Name: ${targetObj.name}
            Designation: ${targetObj.designation}
            Path: ${target}
            Position: ${units.formatLength(mesh.position.x*unitSize)} / ${units.formatLength(mesh.position.y*unitSize)} / ${units.formatLength(mesh.position.z*unitSize)}
            Mass: ${units.formatMass(targetObj.mass)}
            Radius: ${units.formatLength(targetObj.radius)}\n` + (targetObj.orbit ?
            `SMA: ${units.formatLength(targetObj.orbit.sma)}
            ECC: ${targetObj.orbit.ecc}
            MNA: ${targetObj.orbit.mna?.toFixed(3)}
            INC: ${targetObj.orbit.inc}
            LAN: ${targetObj.orbit.lan}
            AOP: ${targetObj.orbit.aop}`
            : `No orbit`);
        }
    } else {
        leftInfoElt.innerText = '';
        rightInfoElt.innerText = '';
    }
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
    controls.update();
    renderer.render(scene, camera);
    if (mesh) {
        oldMeshPos = mesh.position.clone();
    }
    renderBGStars(ra, dec);
    requestAnimationFrame(animate);
}


export function start() {
    window.addEventListener('resize', handleResize);
    window.addEventListener('dblclick', handleDoubleClick);
    window.addEventListener('keydown', handleKeyDown);
    world.start();
    requestAnimationFrame(animate);
    window.setTimeout(async () => {
        let mesh = getObjMesh(target);
        let obj = world.getObj(target);
        if (mesh && obj) {
            camera.position.set(mesh.position.x + obj.radius/unitSize*10, mesh.position.y, mesh.position.z);
        }
    }, 100);
    console.log('Expansion Loading Complete!');
}
