
import * as three from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import * as format from './format';
import {query, sin, cos, tan, asin, atan2, stringInput, numberInput, checkboxInput} from './util';
import {Planet, RootObj} from './obj';
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

let settings = DEFAULT_SETTINGS;
let unitSize = settings.unitSize;

let target: string;
let zoom = 1;

let renderer = new three.WebGLRenderer({
    canvas: query<HTMLCanvasElement>('#main'),
    precision: 'highp',
    alpha: true,
    logarithmicDepthBuffer: true,
});
renderer.setSize(window.innerWidth, window.innerHeight - 40);

let scene = new three.Scene();
scene.add(new three.AmbientLight(0xffffff, 0.2));

let camera = new three.PerspectiveCamera(
    settings.fov,
    window.innerWidth/(window.innerHeight - 40),
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



let objMeshes = new Map<string, three.Mesh>();

function deleteObjectMesh(path: string): void {
    let mesh = objMeshes.get(path);
    if (mesh) {
        mesh.geometry.dispose();
        if (mesh.material instanceof Array) {
            mesh.material.forEach(x => x.dispose());
        } else {
            mesh.material.dispose(); 
        }
        scene.remove(mesh);
    }
}

let textureLoader = new three.TextureLoader();

function createObjectMesh(path: string): void {
    if (objMeshes.has(path)) {
        deleteObjectMesh(path);
    }
    let obj = world.getObj(path);
    if (!obj || obj instanceof RootObj) {
        return;
    }
    let material = new three.MeshStandardMaterial({
        map: obj.texture ? textureLoader.load(obj.texture) : undefined,
        opacity: 1,
        transparent: true,
        color: 'albedo' in obj && obj.albedo ? new three.Color(obj.albedo, obj.albedo, obj.albedo) : undefined,
    });
    if (obj.type === 'star') {
        if (material.map) {
            material.emissiveMap = material.map;
        }
        material.emissive = new three.Color(obj.color);
        material.emissiveIntensity = 10;
    }
    let geometry = new three.SphereGeometry(obj.radius/unitSize, 512, 512);
    let mesh = new three.Mesh(geometry, material);
    if (obj.type === 'star') {
        let light = new three.PointLight(obj.color);
        light.power = world.config.lC / 10**(0.4 * obj.magnitude) / unitSize**2 / 5000;
        light.castShadow = true;
        mesh.add(light);
    }
    mesh.material.side = three.FrontSide;
    mesh.visible = true;
    scene.add(mesh);
    objMeshes.set(path, mesh);
}

for (let path of world.getObjPaths('', true)) {
    createObjectMesh(path);
}

let changedTextures: string[] = [];

function updateObjects(): number {
    let renderedObjects = 0;
    for (let path of world.getObjPaths('', true)) {
        let obj = world.getObj(path);
        let mesh = objMeshes.get(path);
        if (obj && mesh && (obj.alwaysVisible || mesh.position.distanceTo(camera.position) < settings.renderDistance/settings.unitSize)) {
            let [x, y, z] = obj.absolutePosition;
            mesh.position.set(x/unitSize, y/unitSize, z/unitSize);
            let [rx, ry, rz] = obj.rotation;
            mesh.rotation.set(0, 0, 0);
            mesh.rotateX(rx * Math.PI / 180);
            mesh.rotateZ(ry * Math.PI / 180);
            mesh.rotateY(rz * Math.PI / 180);
            if (obj.type === 'star' && mesh.children[0] instanceof three.PointLight) {
                mesh.children[0].power = world.config.lC / 10**(0.4 * obj.magnitude) / unitSize**2 / 5000;
            }
            if (changedTextures.includes(path) && mesh.material instanceof three.MeshStandardMaterial && obj.texture) {
                mesh.material.map = textureLoader.load(obj.texture);
                if (obj.type === 'star') {
                    mesh.material.emissiveMap = mesh.material.map;
                    mesh.material.emissive = new three.Color(obj.color);
                }
            }
            renderedObjects += 1;
            mesh.visible = true;
        } else if (mesh) {
            mesh.visible = false;
        }
    }
    changedTextures = [];
    return renderedObjects;
}


let starRenderer = new three.WebGLRenderer({
    canvas: query<HTMLCanvasElement>('#bg'),
});
starRenderer.setSize(window.innerWidth, window.innerHeight - 40);

let starScene = new three.Scene();

let starCamera = new three.PerspectiveCamera(
    settings.fov,
    window.innerWidth/(window.innerHeight - 40),
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
    color: new three.Color(0x6f6f6f),
}));
let starMesh = new three.Mesh(new three.BoxGeometry(1, 1, 1), starMaterials);
starMesh.rotateX(23.439 * Math.PI / 180);
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
    let mesh: three.Mesh | undefined = objMeshes.get(target);
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
    let mesh = objMeshes.get(target);
    let obj = world.getObj(target);
    if (mesh && obj) {
        camera.position.set(mesh.position.x + obj.radius/unitSize*10, mesh.position.y, mesh.position.z);
    }
}, 100);


function resize(width: number = window.innerWidth, height: number = window.innerHeight - 40): void {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    starRenderer.setSize(width, height);
}

window.addEventListener('resize', () => resize());

let raycaster = new three.Raycaster();

window.addEventListener('dblclick', event => {
    raycaster.setFromCamera(new three.Vector2((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1), camera);
    let intersects = raycaster.intersectObjects(Object.values(objMeshes));
    if (intersects.length > 0) {
        setTarget(Object.entries(objMeshes).filter((x) => x[1] === intersects[0].object)[0][0]);
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
        // Prevent issue of zooming in too far (zoom <= 1e-31) and can't zoom out.
        // Use .11 instead of .1 to compensate for floating point error
        if (zoom >= .11) {
            if (logZoom === Math.floor(logZoom)) {
                zoom -= 10**(floorLogZoom - 1);
            } else {
                zoom -= 10**floorLogZoom;
            }
        }
    } else if (key === '[') {
        let allObjects = world.getObjPaths('', true);
        let index = allObjects.indexOf(target);
        if (index === 0) {
            index = allObjects.length;
        }
        setTarget(allObjects[(index - 1) % allObjects.length]);
    } else if (key === ']') {
        let allObjects = world.getObjPaths('', true);
        let index = allObjects.indexOf(target);
        if (index === allObjects.length - 1) {
            index = -1;
        }
        setTarget(allObjects[(index + 1) % allObjects.length]);
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
    } else if (key === 'F3') {
        event.preventDefault();
        showDebug = !showDebug;
        query('#left-info').innerText = 'Use [ and ] to move between objects!';
    }
});


let showDebug = false;
query('#left-info').innerText = 'Use [ and ] to move between objects!';

function updateUI(renderedObjects: number, ra: number, dec: number): void {
    query('#time').textContent = format.date(world.time);
    query('#time-warp').textContent = world.timeWarp + 'x (' + format.time(world.timeWarp, 2) + '/s)';
    // query('#target').textContent = world.getObj(target).name;
    query('#target').textContent = format.objectName(world.getObj(target));
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


let rightPanelWidth = window.innerWidth * 0.35;
let rightPanel = query('#right-panel');
rightPanel.style.width = rightPanelWidth + 'px';
let rightPanelShown = false;

let rightPanelResizer = query('#right-panel-resizer');
rightPanelResizer.style.right = rightPanelWidth - 15 + 'px';

rightPanelResizer.addEventListener('mousedown', () => {
    window.addEventListener('mousemove', panelResizeMouseMove);
    window.addEventListener('mouseup', panelResizeMouseUp);
});

function panelResizeMouseMove(event: MouseEvent): void {
    rightPanelWidth = window.innerWidth - event.clientX;
    rightPanel.style.width = rightPanelWidth + 'px';
    rightPanelResizer.style.right = rightPanelWidth - 15 + 'px';
    resize(window.innerWidth - rightPanelWidth);
}

function panelResizeMouseUp(): void {
    window.removeEventListener('mousemove', panelResizeMouseMove);
    window.removeEventListener('mouseup', panelResizeMouseUp);
}

function toggleRightPanelButton(eltQuery: string, panelQuery: string): void {
    query(eltQuery).addEventListener('click', () => {
        rightPanelShown = !rightPanelShown;
        rightPanel.style.display = rightPanelResizer.style.display = rightPanelShown ? 'block' : 'none';
        query(panelQuery).style.display = rightPanelShown ? 'flex' : 'none';
        resize(window.innerWidth - (rightPanelShown ? rightPanelWidth : 0));
    });
}

toggleRightPanelButton('#config-button', '#world-config');
numberInput('#wc-tps', world.config.tps, x => world.setConfig('tps', x));
numberInput('#wc-c', world.config.c, x => world.setConfig('c', x));
numberInput('#wc-g', world.config.G, x => world.setConfig('G', x));
numberInput('#wc-lc', world.config.lC, x => world.setConfig('lC', x));
stringInput('#wc-initial-target', world.config.initialTarget, x => world.setConfig('initialTarget', x));

toggleRightPanelButton('#edit-button', '#object-editor');

function setTarget(newTarget: string): void {
    target = newTarget;
    Object.assign(globalThis, {target});
    let obj = world.getObj(target);
    stringInput('#oe-type', obj.type, x => {
        world.setObj(target, Object.assign(world.getObj(target), {type: x}));
        setTarget(target);
        createObjectMesh(target);
    });
    stringInput('#oe-name', obj.name, x => world.setObjProp(target, 'name', x));
    stringInput('#oe-designation', obj.designation, x => world.setObjProp(target, 'name', x));
    numberInput('#oe-position-x', obj.position[0], x => world.setObjProp(target, 'position.0', x));
    numberInput('#oe-position-y', obj.position[1], x => world.setObjProp(target, 'position.1', x));
    numberInput('#oe-position-z', obj.position[2], x => world.setObjProp(target, 'position.2', x));
    numberInput('#oe-velocity-x', obj.velocity[0], x => world.setObjProp(target, 'velocity.0', x));
    numberInput('#oe-velocity-y', obj.velocity[1], x => world.setObjProp(target, 'velocity.1', x));
    numberInput('#oe-velocity-z', obj.velocity[2], x => world.setObjProp(target, 'velocity.2', x));
    numberInput('#oe-mass', obj.mass, x => world.setObjProp(target, 'mass', x));
    numberInput('#oe-radius', obj.radius, x => world.setObjProp(target, 'radius', x));
    query('#oe-orbit').style.display = obj.orbit ? 'block' : 'none';
    query('#oe-add-orbit-container').style.display = obj.orbit ? 'none' : 'block';
    if (obj.orbit) {
        world.setOrbitFromPositionVelocity(target);
        numberInput('#oe-orbit-sma', obj.orbit.sma, x => world.setObjProp(target, 'orbit.sma', x));
        numberInput('#oe-orbit-ecc', obj.orbit.ecc, x => world.setObjProp(target, 'orbit.ecc', x));
        numberInput('#oe-orbit-mna', obj.orbit.mna, x => world.setObjProp(target, 'orbit.mna', x));
        numberInput('#oe-orbit-inc', obj.orbit.inc, x => world.setObjProp(target, 'orbit.inc', x));
        numberInput('#oe-orbit-lan', obj.orbit.lan, x => world.setObjProp(target, 'orbit.lan', x));
        numberInput('#oe-orbit-aop', obj.orbit.aop, x => world.setObjProp(target, 'orbit.aop', x));
    }
    numberInput('#oe-rotation-x', obj.rotation[0], x => world.setObjProp(target, 'rotation.0', x));
    numberInput('#oe-rotation-y', obj.rotation[1], x => world.setObjProp(target, 'rotation.1', x));
    numberInput('#oe-rotation-z', obj.rotation[2], x => world.setObjProp(target, 'rotation.2', x));
    numberInput('#oe-rotation-change-x', obj.rotationChange[0], x => world.setObjProp(target, 'rotationChange.0', x));
    numberInput('#oe-rotation-change-y', obj.rotationChange[1], x => world.setObjProp(target, 'rotationChange.1', x));
    numberInput('#oe-rotation-change-z', obj.rotationChange[2], x => world.setObjProp(target, 'rotationChange.2', x));
    checkboxInput('#oe-always-visible', obj.alwaysVisible, x => world.setObjProp(target, 'alwaysVisible', x));
    stringInput('#oe-texture', obj.texture, x => {
        world.setObjProp(target, 'texture', x);
        changedTextures.push(target);
    });
    stringInput('#oe-spectral-type', obj.spectralType, x => {
        world.setObjProp(target, 'spectralType', x);
        changedTextures.push(target);
    });
    query('#oe-star').style.display = obj.type === 'star' ? 'flex' : 'none';
    query('#oe-planet').style.display = obj.type === 'planet' ? 'flex' : 'none';
    if (obj.type === 'star') {
        numberInput('#oe-magnitude', obj.magnitude, x => world.setObjProp(target, 'magnitude', x));
    } else if (obj.type === 'planet') {
        numberInput('#oe-albedo', obj.albedo, x => world.setObjProp(target, 'albedo', x));
        numberInput('#oe-bond-albedo', obj.bondAlbedo, x => world.setObjProp(target, 'bondAlbedo', x));
    }
}
setTarget(world.config.initialTarget);

query('#oe-add-orbit').addEventListener('click', () => world.setOrbitFromPositionVelocity(target));
query('#oe-set-position').addEventListener('click', () => world.setPositionVelocityFromOrbit(target, true, false));
query('#oe-set-velocity').addEventListener('click', () => world.setPositionVelocityFromOrbit(target, false, true));
query('#oe-set-orbit').addEventListener('click', () => world.setOrbitFromPositionVelocity(target));

let customIndex = 0;
query('#add-button').addEventListener('click', () => {
    customIndex++;
    let path = target + '/custom' + customIndex;
    world.setObj(path, new Planet('', 'custom:' + customIndex, {mass: 0, radius: 0}));
    setTarget(path);
    createObjectMesh(path);
    rightPanelShown = true;
    rightPanel.style.display = rightPanelResizer.style.display = 'block';
    query('#object-editor').style.display = 'flex';
    resize(window.innerWidth - rightPanelWidth);
});


Object.assign(globalThis, {
    world,
    system: world.system,
    fs: world.fs,
    objDir: world.objDir,
    getObj: world.getObj.bind(world),
    setObj: world.setObj.bind(world),
    getObjProp: world.getObjProp.bind(world),
    setObjProp: world.setObjProp.bind(world),
    renderer,
    scene,
    camera,
    controls,
    starRenderer,
    starCamera,
    objMeshes,
});

console.log('Expansion Loading Complete!');
