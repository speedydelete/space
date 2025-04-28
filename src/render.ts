
import * as three from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import * as format from './format';
import {query, sin, cos, tan, asin, atan2, StringInput, NumberInput, CheckboxInput} from './util';
import {Planet, RootObj} from './obj';
import presets from './presets';
import settings from './settings';


let world = presets.default;

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
    let obj = world.get(path);
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

for (let path of world.getPaths('', true)) {
    createObjectMesh(path);
}

let changedTextures: string[] = [];

function updateObjects(): number {
    let renderedObjects = 0;
    for (let path of world.getPaths('', true)) {
        let obj = world.get(path);
        let mesh = objMeshes.get(path);
        if (obj && mesh && (obj.alwaysVisible || mesh.position.distanceTo(camera.position) < settings.renderDistance/settings.unitSize)) {
            let {x, y, z} = obj.position;
            mesh.position.set(x/unitSize, z/unitSize, y/unitSize);
            let {x: rx, y: ry, z: rz} = obj.rotation;
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


let starRenderer: three.WebGLRenderer | null = null;
let starScene: three.Scene | null = null;
let starCamera: three.PerspectiveCamera | null = null;
let starMesh: three.Mesh | null = null;

if (settings.backgroundStars) {
    starRenderer = new three.WebGLRenderer({
        canvas: query<HTMLCanvasElement>('#bg'),
    });
    starRenderer.setSize(window.innerWidth, window.innerHeight - 40);
    
    starScene = new three.Scene();
    
    starCamera = new three.PerspectiveCamera(
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
    starMesh = new three.Mesh(new three.BoxGeometry(1, 1, 1), starMaterials);
    starMesh.rotateX(23.439 * Math.PI / 180);
    starScene.add(starMesh);
}


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
    if (starCamera && starRenderer && starScene) {
        starCamera.quaternion.copy(camera.quaternion);
        starCamera.position.set(0, 0, 0);
        starRenderer.render(starScene, starCamera);
    }
    if (mesh) {
        oldMeshPos = mesh.position.clone();
    }
    requestAnimationFrame(animate);
}


world.start();
requestAnimationFrame(animate);
window.setTimeout(async () => {
    let mesh = objMeshes.get(target);
    let obj = world.get(target);
    if (mesh && obj) {
        camera.position.set(mesh.position.x + obj.radius/unitSize*10, mesh.position.y, mesh.position.z);
    }
}, 100);


function resize(width: number = window.innerWidth, height: number = window.innerHeight - 40): void {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    if (starRenderer) {
        starRenderer.setSize(width, height);
    }
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
    if (document.activeElement && document.activeElement instanceof HTMLInputElement) {
        return;   
    }
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
        let allObjects = world.getPaths('', true);
        let index = allObjects.indexOf(target);
        if (index === 0) {
            index = allObjects.length;
        }
        setTarget(allObjects[(index - 1) % allObjects.length]);
    } else if (key === ']') {
        let allObjects = world.getPaths('', true);
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
    // query('#target').textContent = world.get(target).name;
    query('#target').textContent = format.objectName(world.get(target));
    if (showDebug) {
        query('#left-info').innerText = `FPS: ${fps}
        Camera: ${format.length(camera.position.x*unitSize)} / ${format.length(camera.position.y*unitSize)} / ${format.length(camera.position.z*unitSize)}
        Telescopic Zoom: ${Math.round(zoom*10)/10}
        Objects: ${renderedObjects}/${world.getPaths('', true).length}
        RA: ${ra.toFixed(3)}\u00b0, Dec: ${dec.toFixed(3)}\u00b0
        Time: ${world.time ? format.date(world.time) : 'undefined'}
        Time Warp: ${world.timeWarp}x (${format.time(world.timeWarp)}/s)`;
    }
    updateObjectEditor();
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
new NumberInput('#wc-tps', x => world.setConfig('tps', x), world.config.tps);
new NumberInput('#wc-c', x => world.setConfig('c', x), world.config.c);
new NumberInput('#wc-g', x => world.setConfig('G', x), world.config.G);
new NumberInput('#wc-lc', x => world.setConfig('lC', x), world.config.lC);
new StringInput('#wc-initial-target', x => world.setConfig('initialTarget', x), world.config.initialTarget);

toggleRightPanelButton('#edit-button', '#object-editor');


const objectEditorInputs = {
    type: new StringInput('#oe-type', x => {
        world.set(target, Object.assign(world.get(target), {type: x}));
        createObjectMesh(target);
    }),
    name: new StringInput('#oe-name', x => world.setProp(target, 'name', x)),
    designation: new StringInput('#oe-designation', x => world.setProp(target, 'designation', x)),
    position: [
        new NumberInput('#oe-position-x', x => world.setProp(target, 'position.x', x)),
        new NumberInput('#oe-position-y', x => world.setProp(target, 'position.y', x)),
        new NumberInput('#oe-position-z', x => world.setProp(target, 'position.z', x)),
    ],
    velocity: [
        new NumberInput('#oe-velocity-x', x => world.setProp(target, 'velocity.x', x)),
        new NumberInput('#oe-velocity-y', x => world.setProp(target, 'velocity.y', x)),
        new NumberInput('#oe-velocity-z', x => world.setProp(target, 'velocity.z', x)),
    ],
    mass: new NumberInput('#oe-mass', x => world.setProp(target, 'mass', x)),
    radius: new NumberInput('#oe-radius', x => world.setProp(target, 'radius', x)),
    orbit: {
        ap: new NumberInput('#oe-orbit-ap', x => {
            let obj = world.get(target);
            if (obj.orbit) {
                let pe = obj.orbit.sma * (1 - obj.orbit.ecc);
                obj.orbit.sma = (pe + x) / 2;
                obj.orbit.ecc = (x - pe) / (x + pe);
            }
            world.set(target, obj);
        }),
        pe: new NumberInput('#oe-orbit-pe', x => {
            let obj = world.get(target);
            if (obj.orbit) {
                let ap = obj.orbit.sma * (1 + obj.orbit.ecc);
                obj.orbit.sma = (ap + x) / 2;
                obj.orbit.ecc = (ap - x) / (ap + x);
            }
            world.set(target, obj);
        }),
        sma: new NumberInput('#oe-orbit-sma', x => world.setProp(target, 'orbit.sma', x)),
        ecc: new NumberInput('#oe-orbit-ecc', x => world.setProp(target, 'orbit.ecc', x)),
        mna: new NumberInput('#oe-orbit-mna', x => world.setProp(target, 'orbit.mna', x)),
        inc: new NumberInput('#oe-orbit-inc', x => world.setProp(target, 'orbit.inc', x)),
        lan: new NumberInput('#oe-orbit-lan', x => world.setProp(target, 'orbit.lan', x)),
        aop: new NumberInput('#oe-orbit-aop', x => world.setProp(target, 'orbit.aop', x)),
    },
    gravity: new CheckboxInput('#oe-gravity', x => world.setProp(target, 'gravity', x)),
    useOrbitForGravity: new CheckboxInput('#oe-use-orbit-for-gravity', x => world.setProp(target, 'useOrbitForGravity', x)),
    nbody: new CheckboxInput('#oe-nbody', x => world.setProp(target, 'nbody', x)),
    rotation: [
        new NumberInput('#oe-rotation-x', x => world.setProp(target, 'rotation.x', x)),
        new NumberInput('#oe-rotation-y', x => world.setProp(target, 'rotation.y', x)),
        new NumberInput('#oe-rotation-z', x => world.setProp(target, 'rotation.z', x)),
    ],
    rotationChange: [
        new NumberInput('#oe-rotation-change-x', x => world.setProp(target, 'rotationChange.x', x)),
        new NumberInput('#oe-rotation-change-y', x => world.setProp(target, 'rotationChange.y', x)),
        new NumberInput('#oe-rotation-change-z', x => world.setProp(target, 'rotationChange.z', x)),
    ],
    alwaysVisible: new CheckboxInput('#oe-always-visible', x => world.setProp(target, 'alwaysVisible', x)),
    texture: new StringInput('#oe-texture', x => {
        world.setProp(target, 'texture', x);
        changedTextures.push(target);
    }),
    spectralType: new StringInput('#oe-spectral-type', x => world.setProp(target, 'spectralType', x)),
    magnitude: new NumberInput('#oe-magnitude', x => world.setProp(target, 'magnitude', x)),
    albedo: new NumberInput('#oe-albedo', x => world.setProp(target, 'albedo', x)),
    bondAlbedo: new NumberInput('#oe-bond-albedo', x => world.setProp(target, 'bondAlbedo', x)),
};

function updateObjectEditor(): void {
    let obj = world.get(target);
    objectEditorInputs.type.set(obj.type);
    objectEditorInputs.name.set(obj.name);
    objectEditorInputs.designation.set(obj.designation);
    for (let i = 0; i < 3; i++) {
        objectEditorInputs.position[i].set(obj.position[i]);
        objectEditorInputs.velocity[i].set(obj.velocity[i]);
        objectEditorInputs.rotation[i].set(obj.rotation[i]);
        objectEditorInputs.rotationChange[i].set(obj.rotationChange[i]);
    }
    objectEditorInputs.mass.set(obj.mass);
    objectEditorInputs.radius.set(obj.radius);
    query('#oe-orbit').style.display = obj.orbit ? 'block' : 'none';
    query('#oe-add-orbit-container').style.display = obj.orbit ? 'none' : 'block';
    if (obj.orbit) {
        objectEditorInputs.orbit.ap.set(obj.orbit.sma * (1 + obj.orbit.ecc));
        objectEditorInputs.orbit.pe.set(obj.orbit.sma * (1 - obj.orbit.ecc));
        objectEditorInputs.orbit.sma.set(obj.orbit.sma);
        objectEditorInputs.orbit.ecc.set(obj.orbit.ecc);
        objectEditorInputs.orbit.mna.set(obj.orbit.mna);
        objectEditorInputs.orbit.inc.set(obj.orbit.inc);
        objectEditorInputs.orbit.lan.set(obj.orbit.lan);
        objectEditorInputs.orbit.aop.set(obj.orbit.aop);
    }
    objectEditorInputs.gravity.set(obj.gravity);
    objectEditorInputs.useOrbitForGravity.set(obj.useOrbitForGravity);
    objectEditorInputs.nbody.set(obj.nbody);
    objectEditorInputs.alwaysVisible.set(obj.alwaysVisible);
    objectEditorInputs.texture.set(obj.texture);
    objectEditorInputs.spectralType.set(obj.spectralType);
    query('#oe-star').style.display = obj.type === 'star' ? 'flex' : 'none';
    query('#oe-planet').style.display = obj.type === 'planet' ? 'flex' : 'none';
    if (obj.type === 'star') {
        objectEditorInputs.magnitude.set(obj.magnitude);
    } else if (obj.type === 'planet') {
        objectEditorInputs.albedo.set(obj.albedo);
        objectEditorInputs.bondAlbedo.set(obj.bondAlbedo);
    }
}

function setTarget(newTarget: string): void {
    target = newTarget;
    Object.assign(globalThis, {target});
}


setTarget(world.config.initialTarget);
updateObjectEditor();

query('#oe-add-orbit').addEventListener('click', () => world.setOrbitFromPositionVelocity(target));
query('#oe-set-position').addEventListener('click', () => world.setPositionVelocityFromOrbit(target, true, false));
query('#oe-set-velocity').addEventListener('click', () => world.setPositionVelocityFromOrbit(target, false, true));
query('#oe-set-orbit').addEventListener('click', () => world.setOrbitFromPositionVelocity(target));

let customIndex = 0;
query('#add-button').addEventListener('click', () => {
    customIndex++;
    let path = target + '/custom' + customIndex;
    world.set(path, new Planet('', 'custom:' + customIndex, {mass: 0, radius: 0, gravity: false}));
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
    get: world.get.bind(world),
    set: world.set.bind(world),
    getProp: world.getProp.bind(world),
    setProp: world.setProp.bind(world),
    renderer,
    scene,
    camera,
    controls,
    starRenderer,
    starCamera,
    objMeshes,
});

console.log('Expansion Loading Complete!');
