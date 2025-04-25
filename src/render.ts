
import * as three from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import * as format from './format';
import {query, sin, cos, tan, asin, atan2, pi} from './util';
import {RootObj} from './obj';
import presets from './presets';


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
    canvas: query<HTMLCanvasElement>('#main'),
    precision: 'highp',
    alpha: true,
    logarithmicDepthBuffer: true,
});
renderer.setSize(window.innerWidth, window.innerHeight - 30);

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


let starRenderer = new three.WebGLRenderer({
    canvas: query<HTMLCanvasElement>('#bg'),
});
starRenderer.setSize(window.innerWidth, window.innerHeight - 30);

let starScene = new three.Scene();

let starCamera = new three.PerspectiveCamera(
    settings.fov,
    window.innerWidth/(window.innerHeight - 30),
    settings.cameraMinDistance/unitSize,
    settings.cameraMaxDistance/unitSize,
);

let starMaterials = [
    'data/textures/nasa/stars/px.png',
    'data/textures/nasa/stars/nx.png',
    'data/textures/nasa/stars/py.png',
    'data/textures/nasa/stars/ny.png',
    'data/textures/nasa/stars/pz.png',
    'data/textures/nasa/stars/nz.png',
].map(path => new three.MeshBasicMaterial({
    map: textureLoader.load(path),
    side: three.BackSide,
    color: new three.Color(0x7f7f7f)
}));
let starMesh = new three.Mesh(new three.BoxGeometry(1, 1, 1), starMaterials);
starMesh.rotateX((world.getObj('sun/earth').axis?.tilt ?? 0) * Math.PI / 180);
starScene.add(starMesh);


let blurred = false;
let frames = 0;
let prevRealTime = performance.now();
let oldMeshPos = new three.Vector3(0, 0, 0);
let fps = parseInt(localStorage['space-fps'] ?? '60');

const e = 23.439;

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
    let ra = atan2(sin(l)*cos(e) - tan(b)*sin(e), cos(l)) + 180;
    let dec = asin(sin(b)*cos(e) + cos(b)*sin(e)*sin(l));
    updateUI(renderedObjects, ra, dec);
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
    controls.update();
    renderer.render(scene, camera);
    starCamera.quaternion.copy(camera.quaternion);
    starCamera.position.set(0, 0, 0);
    starRenderer.render(starScene, starCamera);
    if (mesh) {
        oldMeshPos = mesh.position.clone();
    }
    requestAnimationFrame(animate);
}


world.start();
requestAnimationFrame(animate);
window.setTimeout(async () => {
    let mesh = getObjMesh(target);
    let obj = world.getObj(target);
    if (mesh && obj) {
        camera.position.set(mesh.position.x + obj.radius/unitSize*10, mesh.position.y, mesh.position.z);
    }
}, 100);


window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / (window.innerHeight - 30);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight - 30);
    starRenderer.setSize(window.innerWidth, window.innerHeight - 30);
});

let raycaster = new three.Raycaster();

window.addEventListener('dblclick', event => {
    raycaster.setFromCamera(new three.Vector2((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1), camera);
    let intersects = raycaster.intersectObjects(Object.values(objMeshes));
    if (intersects.length > 0) {
        target = Object.entries(objMeshes).filter((x) => x[1] === intersects[0].object)[0][0];
        controls.target.copy(intersects[0].object.position);
    }
});

window.addEventListener('keydown', (event: KeyboardEvent) => {
    let key = event.key;
    if (key === ',') {
        if (Math.log10(world.timeWarp) % 1 === 0) {
            world.timeWarp /= 2;
        } else {
            world.timeWarp /= 5;
        }
    } else if (key === '.') {
        if (Math.log10(world.timeWarp) % 1 === 0) {
            world.timeWarp *= 5;
        } else {
            world.timeWarp *= 2;
        }
    } else if (key === '/') {
        event.preventDefault();
        world.timeWarp = 1;
    } else if (key === '=' || key === '+') {
        if (event.shiftKey) {
            zoom = 1;
        } else {
            zoom += 10**Math.floor(Math.log10(zoom));
        }
    } else if (key === '-') {
        let logZoom = Math.log10(zoom);
        let floorLogZoom = Math.floor(logZoom);
        if (logZoom === Math.floor(logZoom)) {
            zoom -= 10**(floorLogZoom - 1);
        } else {
            zoom -= 10**floorLogZoom;
        }
    } else if (key === '[') {
        let allObjects = world.getObjPaths('', true);
        let index = allObjects.indexOf(target);
        if (index === 0) {
            index = allObjects.length;
        }
        target = allObjects[(index - 1) % allObjects.length];
    } else if (key === ']') {
        let allObjects = world.getObjPaths('', true);
        let index = allObjects.indexOf(target);
        if (index === allObjects.length - 1) {
            index = -1;
        }
        target = allObjects[(index + 1) % allObjects.length];
    } else if (key === 'i') {
        camera.position.x += 100/unitSize;
    } else if (key === 'k') {
        camera.position.x -= 100/unitSize;
    } else if (key === 'j') {
        camera.position.z -= 100/unitSize;
    } else if (key === 'l') {
        camera.position.z += 100/unitSize;
    } else if (key === 'h') {
        camera.position.y += 100/unitSize;
    } else if (key === 'n') {
        camera.position.y -= 100/unitSize;
    }
});


let showDebug = true;

function updateUI(renderedObjects: number, ra: number, dec: number): void {
    query('#time').textContent = format.date(world.time);
    query('#time-warp').textContent = world.timeWarp + 'x (' + format.time(world.timeWarp, 2) + '/s)';
    if (showDebug) {
        query('#left-info').innerText = `FPS: ${fps}
        Camera: ${format.length(camera.position.x*unitSize)} / ${format.length(camera.position.y*unitSize)} / ${format.length(camera.position.z*unitSize)}
        Telescopic Zoom: ${Math.round(zoom*10)/10}
        Objects: ${renderedObjects}/${world.getObjPaths('', true).length}
        RA: ${ra.toFixed(3)}\u00b0, Dec: ${dec.toFixed(3)}\u00b0
        Time: ${world.time ? format.date(world.time) : 'undefined'}
        Time Warp: ${world.timeWarp}x (${format.time(world.timeWarp)}/s)`;
    }
}

query('#play-pause-button').addEventListener('click', () => {
    if (world.running) {
        world.stop();
        query('#play-icon').style.display = 'block';
        query('#pause-icon').style.display = 'none';
    } else {
        world.start();
        query('#play-icon').style.display = 'none';
        query('#pause-icon').style.display = 'block';
    }
});

query('#slow-button').addEventListener('click', () => {
    if (Math.log10(world.timeWarp) % 1 === 0) {
        world.timeWarp /= 2;
    } else {
        world.timeWarp /= 5;
    }
});

query('#fast-button').addEventListener('click', () => {
    if (Math.log10(world.timeWarp) % 1 === 0) {
        world.timeWarp *= 5;
    } else {
        world.timeWarp *= 2;
    }
});


console.log('Expansion Loading Complete!');
