
import * as three from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {join} from 'fake-system';
import * as units from './units';
import {Obj, RootObj} from './obj';
import {World} from './world';


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
    unitSize: 150000000000,
    cameraMinDistance: 0.00000001,
    cameraMaxDistance: 300000000,
    controlsMinDistance: 0.00001,
    controlsMaxDistance: Number.MAX_SAFE_INTEGER,
}

let helpMessage = `Use the "[" and "]" keys to select different objects, or just click on an object.
Use the "," and "." keys to control the time warp, and use the "/" key to reset it.
Use the "+" and "-" keys to do telescopic zoom, and use Shift-+ to reset it.`;


export class Renderer {
    
    world: World;
    settings: Settings;

    renderer: three.WebGLRenderer;
    scene: three.Scene;
    camera: three.PerspectiveCamera;
    controls: OrbitControls;
    raycaster: three.Raycaster;
    objMeshes: {[key: string]: three.Mesh} = {};
    oldMeshPos: three.Vector3 = new three.Vector3(0, 0, 0);
    
    running: boolean = false;
    frames: number = 0;
    prevRealTime: number = performance.now();
    fps: number = 60;
    target: string = '';
    zoom: number = 1;
    blurred: boolean = false;
    animateRequest: number | null = null;
    intervals: number[] = [];
    initialStartInterval: null | number = null;
    initialStartComplete: boolean = false;
    closeLoadingScreenInterval: null | number = null;
    leftInfoElt: HTMLElement;
    rightInfoElt: HTMLElement;

    constructor(world: World, settings: Settings) {
        this.world = world;
        this.settings = settings;
        this.renderer = new three.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.scene = new three.Scene();
        this.camera = new three.PerspectiveCamera(
            this.settings.fov,
            window.innerWidth/window.innerHeight,
            this.settings.cameraMinDistance/this.unitSize,
            this.settings.cameraMaxDistance/this.unitSize,
        );
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.minDistance = this.settings.controlsMinDistance/this.settings.unitSize;
        this.controls.maxDistance = this.settings.controlsMaxDistance/this.settings.unitSize;
        this.controls.keys = {LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', BOTTOM: 'ArrowDown'}
        this.controls.keyPanSpeed = 2;
        this.controls.update();
        this.controls.listenToKeyEvents(window);
        this.scene.add(new three.AmbientLight(0xffffff, 0.2));
        this.raycaster = new three.Raycaster();
        let leftInfoElt = document.getElementById('left-info');
        let rightInfoElt = document.getElementById('right-info');
        if (!leftInfoElt || !rightInfoElt) {
            throw new Error('missing info element(s)');
        }
        this.leftInfoElt = leftInfoElt;
        this.rightInfoElt = rightInfoElt;
        this.handleResize = this.handleResize.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    get unitSize(): number {
        return this.settings.unitSize;
    }

    getObjMesh(path: string): three.Mesh | undefined {
        if (path.startsWith('/')) path = path.slice(1);
        return this.objMeshes[path];
    }

    handleResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    handleClick(event: MouseEvent): void {
        // this.raycaster.setFromCamera(new three.Vector2(
        //     (event.clientX / window.innerWidth) * 2 - 1,
        //     -(event.clientY / window.innerHeight) * 2 + 1), this.camera);
        // let intersects = this.raycaster.intersectObjects(Object.values(this.objMeshes));
        // if (intersects.length > 0) {
        //     this.target = Object.entries(this.objMeshes).filter((x) => x[1] === intersects[0].object)[0][0];
        //     this.controls.target.copy(intersects[0].object.position);
        // }
    }

    async handleKeyDown(event: KeyboardEvent): Promise<void> {
        if (event.key === ',') {
            let timeWarp = this.world.timeWarp;
            if (Math.log10(timeWarp) % 1 === 0) {
                timeWarp /= 2;
            } else {
                timeWarp /= 5;
            }
            this.world.timeWarp = timeWarp;
        } else if (event.key === '.') {
            let timeWarp = this.world.timeWarp;
            if (Math.log10(timeWarp) % 1 === 0) {
                timeWarp *= 5;
            } else {
                timeWarp *= 2;
            }
            this.world.timeWarp = timeWarp;
        } else if (event.key === '/') {
            event.preventDefault();
            this.world.timeWarp = 1;
        } else if (event.key === '=' || event.key === '+') {
            if (event.shiftKey) {
                this.zoom = 1;
            } else {
                this.zoom += 10**Math.floor(Math.log10(this.zoom));
            }
        } else if (event.key === '-') {
            let logZoom = Math.log10(this.zoom);
            let floorLogZoom = Math.floor(logZoom);
            if (logZoom === Math.floor(logZoom)) {
                this.zoom -= 10**(floorLogZoom - 1);
            } else {
                this.zoom -= 10**floorLogZoom;
            }
        } else if (event.key === '[') {
            let allObjects = this.world.getObjPaths('', true);
            let index = allObjects.indexOf(this.target);
            if (index === 0) {
                index = allObjects.length;
            }
            this.target = allObjects[(index - 1) % allObjects.length];
        } else if (event.key === ']') {
            let allObjects = this.world.getObjPaths('', true);
            let index = allObjects.indexOf(this.target);
            if (index === allObjects.length - 1) {
                index = -1;
            }
            this.target = allObjects[(index + 1) % allObjects.length];
        } else if (event.key === 'Escape') {
        } else if (event.key === 'h') {
            alert(helpMessage);
        }
    }

    updateObjects(): number {
        let renderedObjects = 0;
        for (let path of this.world.getObjPaths('', true)) {
            let object = this.world.getObj(path);
            let mesh = this.getObjMesh(path);
            if (object !== undefined && mesh !== undefined && (object.alwaysVisible || mesh.position.distanceTo(this.camera.position) < this.settings.renderDistance/this.settings.unitSize)) {
                let [x, y, z] = object.position;
                mesh.position.set(x/this.unitSize, y/this.unitSize, z/this.unitSize);
                mesh.rotation.set(0, 0, 0);
                if (object.axis) {
                    mesh.rotateX(object.axis.tilt * Math.PI / 180);
                    if (object.axis.epoch !== null) {
                        if (object.axis.period === 'sync') {
                            console.error('period is sync for', object, 'path:', path);
                        } else if (this.world.time) {
                            let diff = (this.world.time - new Date(object.axis.epoch).getTime()/1000);
                            mesh.rotateY((diff/object.axis.period % 1) * Math.PI * 2);
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

    animate(): void {
        let renderedObjects = this.updateObjects();
        if (document.hidden || document.visibilityState === 'hidden') {
            this.blurred = true;
            this.animateRequest = requestAnimationFrame(this.animate.bind(this));
            return;
        } else if (this.blurred) {
            this.blurred = false;
            this.frames = 0;
            this.prevRealTime = performance.now();
            this.fps = 60;
        }
        this.frames++;
        let realTime = performance.now();
        if (realTime >= this.prevRealTime + 1000) {
            this.fps = Math.round((this.frames * 1000)/(realTime - this.prevRealTime));
            this.frames = 0;
            this.prevRealTime = realTime;
        }
        let targetObj: Obj | undefined = this.world.getObj(this.target);
        let mesh: three.Mesh | undefined = this.getObjMesh(this.target);
        if (mesh && mesh.position) {
            this.camera.position.x += mesh.position.x - this.oldMeshPos.x;
            this.camera.position.y += mesh.position.y - this.oldMeshPos.y;
            this.camera.position.z += mesh.position.z - this.oldMeshPos.z;
            this.controls.target.copy(mesh.position);
        }
        if (this.leftInfoElt) {
            this.leftInfoElt.innerText = `FPS: ${this.fps}
            Camera X: ${units.formatLength(this.camera.position.x*this.unitSize)}
            Camera Y: ${units.formatLength(this.camera.position.y*this.unitSize)}
            Camera Z: ${units.formatLength(this.camera.position.z*this.unitSize)}
            Telescopic Zoom: ${Math.round(this.zoom*10)/10}
            Total Objects: ${this.world.getObjPaths('', true).length}
            Rendered Objects: ${renderedObjects}
            Time: ${this.world.time ? units.formatDate(this.world.time) : 'undefined'}
            Time Warp: ${this.world.timeWarp}x (${units.formatTime(this.world.timeWarp)}/s)
            Press H for help.`;
        }
        if (this.rightInfoElt && targetObj !== undefined && mesh !== undefined) {
            this.rightInfoElt.innerText = `Name: ${targetObj.name}
            Designation: ${targetObj.designation}
            Path: ${this.target}
            X: ${units.formatLength(mesh.position.x*this.unitSize)}
            Y: ${units.formatLength(mesh.position.y*this.unitSize)}
            Z: ${units.formatLength(mesh.position.z*this.unitSize)}\n` + (targetObj.orbit ?
            `\tSMA: ${units.formatLength(targetObj.orbit.sma)}
            \tECC: ${targetObj.orbit.ecc}
            \tMNA: ${targetObj.orbit.mna?.toFixed(3)}
            \tINC: ${targetObj.orbit.inc}
            \tLAN: ${targetObj.orbit.lan}
            \tAOP: ${targetObj.orbit.aop}`
            : `No orbit`);
        }
        this.camera.zoom = this.zoom;
        this.camera.updateProjectionMatrix();
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        if (mesh) this.oldMeshPos = mesh.position.clone();
        this.animateRequest = requestAnimationFrame(this.animate.bind(this));
    }

    async init(): Promise<void> {
        let textureLoader = new three.TextureLoader();;
        for (let path of this.world.getObjPaths('', true)) {
            let object = this.world.getObj(path);
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
                material.emissive = new three.Color(await object.color);
                material.emissiveIntensity = 2;
            }
            let geometry = new three.SphereGeometry(object.radius/this.unitSize, 512, 512);
            let mesh = new three.Mesh(geometry, material);
            let [x, y, z] = object.position;
            mesh.position.set(x/this.unitSize, y/this.unitSize, z/this.unitSize);
            if (object.type === 'star') {
                let light = new three.PointLight(await object.color);
                light.power = this.world.config.lC / 10**(0.4 * object.magnitude) / this.unitSize**2 / 5000;
                light.castShadow = true;
                mesh.add(light);
            }
            mesh.material.side = three.DoubleSide;
            mesh.visible = true;
            this.scene.add(mesh);
            this.objMeshes[path] = mesh;
        }
    }

    async start(): Promise<void> {
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('click', this.handleClick);
        window.addEventListener('keydown', this.handleKeyDown);
        await this.init();
        this.world.start();
        this.animateRequest = requestAnimationFrame(this.animate.bind(this));
        if (!this.initialStartComplete) {
            this.initialStartInterval = window.setInterval((async () => {
                if (this.frames > 100) {
                    this.initialStartComplete = true;
                    this.target = this.world.config.initialTarget;
                    let mesh = this.getObjMesh(this.target);
                    let object = this.world.getObj(this.target);
                    if (mesh && object) {
                        this.camera.position.set(mesh.position.x + object.radius/this.unitSize*10, mesh.position.y, mesh.position.z);
                    }
                    if (this.initialStartInterval) {
                        window.clearInterval(this.initialStartInterval);
                    }
                }
            }).bind(this), 10);
            this.intervals.push(this.initialStartInterval);
        }
        // this.intervals.push(window.setInterval(this.save.bind(this), 10000));
        this.running = true;
        document.body.insertBefore(this.renderer.domElement, document.body.firstElementChild);
        console.log('Expansion Loading Complete!');
    }

    async stop(): Promise<void> {
        this.running = false;
        for (let interval of this.intervals) {
            window.clearInterval(interval);
        }
        if (this.animateRequest !== null) cancelAnimationFrame(this.animateRequest);
        this.animateRequest = null;
        this.world.stop();
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('click', this.handleClick);
        window.removeEventListener('keydown', this.handleKeyDown);
    }

}

