
import * as three from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import * as util from './util.ts';
import {RootObj, type Obj} from './obj.ts';
import {join, World} from './world.ts';
import {emptyWorld} from './presets.ts';
import type {GetTimeRequest, GetTimeWarpRequest, GetObjectRequest, GetAllObjectsRequest, GetConfigRequest, StartRequest, StopRequest, Request, ResponseForRequest, SentRequest, SentResponse, SetTimeWarpRequest} from './server.ts';

interface Settings {
    fov: number,
    renderDistance: number,
    unitSize: number,
    cameraMinDistance: number,
    cameraMaxDistance: number,
    controlsMinDistance: number,
    controlsMaxDistance: number,
}

type SettingsKey = keyof Settings;
type SettingsValue = Settings[SettingsKey];

const defaultSettings: Settings = {
    fov: 70,
    renderDistance: 150000000000,
    unitSize: 150000000000,
    cameraMinDistance: 0.00000001,
    cameraMaxDistance: 300000000,
    controlsMinDistance: 0.00001,
    controlsMaxDistance: Number.MAX_SAFE_INTEGER,
}

function getSettings(): Settings {
    const storageSettings = localStorage.getItem('space-game-settings');
    return storageSettings !== null ? JSON.parse(storageSettings) : defaultSettings;
}

const helpMessage = `Use the "[" and "]" keys to select different objects, or just click on an object.
Use the "," and "." keys to control the time warp, and use the "/" key to reset it.
Use the "+" and "-" keys to do telescopic zoom, and use Shift-+ to reset it.`;

class Client {

    world: World = emptyWorld;
    settings: Settings;

    syncSend: (data: SentRequest) => void;
    syncRecv: () => SentResponse[];
    waitingMsgs: {[key: number]: (value: any) => void} = {};
    nextMsgId: number = 0;

    target: string = '';
    zoom: number = 1;

    renderer: three.WebGLRenderer;
    scene: three.Scene;
    camera: three.PerspectiveCamera;
    controls: OrbitControls;
    raycaster: three.Raycaster;
    objMeshes: {[key: string]: three.Mesh} = {};
    oldMeshPos: three.Vector3 = new three.Vector3(0, 0, 0);
    
    leftInfoElt: HTMLElement | null;
    rightInfoElt: HTMLElement | null;

    running: boolean = false;
    frames: number = 0;
    prevRealTime: number = performance.now();
    fps: number = 60;
    blurred: boolean = false;
    animateRequest: null | number = null;
    intervals: number[] = [];
    initialStartInterval: null | number = null;
    initialStartComplete: boolean = false;
    closeLoadingScreenInterval: null | number = null;

    boundHandleResize: (event: Event) => void;
    boundHandleClick: (event: MouseEvent) => void;
    boundHandleKeyDown: (event: KeyboardEvent) => void;
    boundHandleMessage: (event: MessageEvent) => void;

    constructor(send: (data: SentRequest) => void, recv: () => SentResponse[]) {
        this.syncSend = send;
        this.syncRecv = recv;
        this.settings = getSettings();
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
        this.controls.minDistance = this.settings.controlsMinDistance/this.unitSize;
        this.controls.maxDistance = this.settings.controlsMaxDistance/this.unitSize;
        this.controls.keys = {LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', BOTTOM: 'ArrowDown'}
        this.controls.keyPanSpeed = 2;
        this.controls.update();
        this.controls.listenToKeyEvents(window);
        this.scene.add(new three.AmbientLight(0xffffff, 0.2));
        this.raycaster = new three.Raycaster();        
        this.leftInfoElt = document.getElementById('left-info');
        this.rightInfoElt = document.getElementById('right-info');
        this.boundHandleResize = this.handleResize.bind(this);
        this.boundHandleClick = this.handleClick.bind(this);
        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        this.boundHandleMessage = this.handleMessage.bind(this);
    }

    get unitSize(): number {
        return this.settings.unitSize;
    }

    postMessage(type: string, data: any = undefined): void {
        if (window.top) {
            window.top.postMessage({
                isSpace: true,
                type: type,
                data: data,
            }, window.origin);
        }
    }

    checkMessages(): void {
        for (const msg of this.syncRecv()) {
            if (msg.id in this.waitingMsgs) {
                this.waitingMsgs[msg.id](msg.data.data);
                delete this.waitingMsgs[msg.id];
            }
        }
    }

    async send<T extends Request>(type: T['type'], data: T['data'] = undefined): Promise<ResponseForRequest<T>['data']> {
        // @ts-ignore
        const msg: SentRequest = {id: this.nextMsgId, data: {type: type, data: data}};
        this.nextMsgId += 2;
        this.syncSend(msg);
        // @ts-ignore
        const {promise, resolve} = Promise.withResolvers();
        this.waitingMsgs[msg.id] = resolve;
        return promise;
    }

    getObjectMesh(path: string): three.Mesh | undefined {
        if (path.startsWith('/')) path = path.slice(1);
        return this.objMeshes[path];
    }

    handleResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    handleClick(event: MouseEvent): void {
       this.raycaster.setFromCamera(new three.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1), this.camera);
        const intersects = this.raycaster.intersectObjects(Object.values(this.objMeshes));
        if (intersects.length > 0) {
            this.target = Object.entries(this.objMeshes).filter((x) => x[1] === intersects[0].object)[0][0];
            this.controls.target.copy(intersects[0].object.position);
        }
    };

    async handleKeyDown(event: KeyboardEvent): Promise<void> {
        if (event.key === ',') {
            let timeWarp = this.world.timeWarp;
            if (Math.log10(timeWarp) % 1 === 0) {
                timeWarp /= 2;
            } else {
                timeWarp /= 5;
            }
            this.world.timeWarp = timeWarp;
            this.send<SetTimeWarpRequest>('set-time-warp', timeWarp);
        } else if (event.key === '.') {
            let timeWarp = this.world.timeWarp;
            if (Math.log10(timeWarp) % 1 === 0) {
                timeWarp *= 5;
            } else {
                timeWarp *= 2;
            }
            this.world.timeWarp = timeWarp;
            this.send<SetTimeWarpRequest>('set-time-warp', timeWarp);
        } else if (event.key === '/') {
            event.preventDefault();
            this.world.timeWarp = 1;
            this.send<SetTimeWarpRequest>('set-time-warp', 1);
        } else if (event.key === '=' || event.key === '+') {
            if (event.shiftKey) {
                this.zoom = 1;
            } else {
                this.zoom += 10**Math.floor(Math.log10(this.zoom));
            }
        } else if (event.key === '-') {
            const logZoom = Math.log10(this.zoom);
            const floorLogZoom = Math.floor(logZoom);
            if (logZoom === Math.floor(logZoom)) {
                this.zoom -= 10**(floorLogZoom - 1);
            } else {
                this.zoom -= 10**floorLogZoom;
            }
        } else if (event.key === '[') {
            const allObjects = this.world.lsObjAll();
            let index = allObjects.indexOf(this.target);
            if (index === 0) {
                index = allObjects.length;
            }
            this.target = allObjects[(index - 1) % allObjects.length];
        } else if (event.key === ']') {
            const allObjects = this.world.lsObjAll();
            let index = allObjects.indexOf(this.target);
            if (index === allObjects.length - 1) {
                index = -1;
            }
            this.target = allObjects[(index + 1) % allObjects.length];
        } else if (event.key === 'Escape') {
            this.postMessage('escape');
        } else if (event.key === 'h') {
            alert(helpMessage);
        }
    };

    handleMessage(event: MessageEvent): void {
        if (event.source === window.top && event.data.isSpace === true) {
            const {type} = event.data;
            if (type === 'start') {
                this.start();
            } else if (type === 'stop') {
                this.stop();
            }
        }
    }

    updateObjects(): number {
        let renderedObjects = 0;
        for (const filename of this.world.lsObjAll()) {
            const path = join(filename);
            const object = this.world.readObj(path);
            const mesh = this.getObjectMesh(path);
            if (object !== undefined && mesh !== undefined && (object.alwaysVisible || mesh.position.distanceTo(this.camera.position) < this.settings.renderDistance/this.settings.unitSize)) {
                const [x, y, z] = object.position;
                mesh.position.set(x/this.unitSize, y/this.unitSize, z/this.unitSize);
                mesh.rotation.set(0, 0, 0);
                if (object.axis) {
                    mesh.rotateX(object.axis.tilt * Math.PI / 180);
                    if (object.axis.epoch !== null) {
                        if (object.axis.period === 'sync') {
                            console.error('period is sync for', object, 'path:', path);
                        } else if (this.world.time) {
                            const diff = (this.world.time.getTime() - new Date(object.axis.epoch).getTime())/1000;
                            mesh.rotateY((diff/object.axis.period % 1) * Math.PI * 2);
                        }
                    }
                }
                if (object.type === 'star') {
                    
                }
                renderedObjects += 1;
                mesh.visible = true;
            } else if (mesh) {
                mesh.visible = false;
            }
        }
        return renderedObjects;
    }

    async resyncTime(): Promise<void> {
        const newTime = await this.send<GetTimeRequest>('get-time');
        if (newTime) this.world.time = newTime;
        this.world.timeWarp = await this.send<GetTimeWarpRequest>('get-time-warp');
    }

    async resyncObjects(): Promise<void> {
        for (const {path, object} of await this.send<GetAllObjectsRequest>('get-all-objects')) {
            if (object !== undefined) {
                this.world.writeObj(path, object);
            }
        }
    }

    animate(): void {
        const renderedObjects = this.updateObjects();
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
        const realTime = performance.now();
        if (realTime >= this.prevRealTime + 1000) {
            this.fps = Math.round((this.frames * 1000)/(realTime - this.prevRealTime));
            this.frames = 0;
            this.prevRealTime = realTime;
        }
        const targetObj: Obj | undefined = this.world.readObj(this.target);
        const mesh: three.Mesh | undefined = this.getObjectMesh(this.target);
        if (mesh && mesh.position) {
            this.camera.position.x += mesh.position.x - this.oldMeshPos.x;
            this.camera.position.y += mesh.position.y - this.oldMeshPos.y;
            this.camera.position.z += mesh.position.z - this.oldMeshPos.z;
            this.controls.target.copy(mesh.position);
        }
        if (this.leftInfoElt) {
            this.leftInfoElt.innerText = `FPS: ${this.fps}
            Camera X: ${util.formatLength(this.camera.position.x*this.unitSize)}
            Camera Y: ${util.formatLength(this.camera.position.y*this.unitSize)}
            Camera Z: ${util.formatLength(this.camera.position.z*this.unitSize)}
            Telescopic Zoom: ${Math.round(this.zoom*10)/10}
            Total Objects: ${this.world.lsObjAll().length}
            Rendered Objects: ${renderedObjects}
            Time: ${this.world.time ? util.formatDate(this.world.time) : 'undefined'}
            Time Warp: ${this.world.timeWarp}x (${util.formatTime(this.world.timeWarp)}/s)
            Press H for help.`;
        }
        if (this.rightInfoElt && targetObj !== undefined && mesh !== undefined) {
            this.rightInfoElt.innerText = `Name: ${targetObj.name}
            Designation: ${targetObj.designation}
            Path: ${this.target}
            X: ${util.formatLength(mesh.position.x*this.unitSize)}
            Y: ${util.formatLength(mesh.position.y*this.unitSize)}
            Z: ${util.formatLength(mesh.position.z*this.unitSize)}\n` + (targetObj.orbit ?
            `\tSMA: ${util.formatLength(targetObj.orbit.sma)}
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

    setLoadingScreenMessage(message: string): Promise<void> {
        console.log(message);
        // @ts-ignore
        const {promise, resolve} = Promise.withResolvers();
        function handleMessage(event: MessageEvent) {
            if (event.source === window.top && event.data.isSpace === true) {
                resolve(true);
                window.removeEventListener('message', handleMessage);   
            }
        }
        window.addEventListener('message', handleMessage);
        this.postMessage('set-loading-screen-message', message);
        return promise;
    }
    
    async init(): Promise<void> {
        const textureLoader = new three.TextureLoader();;
        for (const {path, object} of await this.send<GetAllObjectsRequest>('get-all-objects')) {
            if (object === undefined) continue;
            this.world.writeObj(path, object);
        }
        this.world.init();
        for (const path of this.world.lsObjAll()) {
            await this.setLoadingScreenMessage(`Loading ${path}`);
            const object = this.world.readObj(path);
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
            if (object.$type === 'star') {
                if (material.map) material.emissiveMap = material.map;
                material.emissive = new three.Color(object.color);
                material.emissiveIntensity = 2;
            }
            const geometry = new three.SphereGeometry(object.radius/this.unitSize, 512, 512);
            const mesh = new three.Mesh(geometry, material);
            mesh.position.set(...object.position);
            if (object.$type === 'star') {
                const light = new three.PointLight(object.color);
                light.power = this.world.config.lC / 10**(0.4 * object.magnitude) / this.unitSize**2 / 20000;
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
        await this.setLoadingScreenMessage('Adding event listeners');
        this.intervals.push(window.setInterval(this.checkMessages.bind(this), 1));
        window.addEventListener('resize', this.boundHandleResize);
        window.addEventListener('click', this.boundHandleClick);
        window.addEventListener('keydown', this.boundHandleKeyDown);
        window.addEventListener('message', this.boundHandleMessage);
        await this.setLoadingScreenMessage('Starting server');
        await this.send<StartRequest>('start');
        this.world = emptyWorld;
        await this.setLoadingScreenMessage('Syncing time');
        const time = await this.send<GetTimeRequest>('get-time');
        this.world.timeWarp = await this.send<GetTimeWarpRequest>('get-time-warp');
        this.world.writejson('/etc/config', await this.send<GetConfigRequest>('get-config'));
        if (time !== undefined) this.world.time = time;
        await this.setLoadingScreenMessage('Loading objects');
        await this.init();
        this.world.start();
        await this.setLoadingScreenMessage('Starting animation loop');
        this.animateRequest = requestAnimationFrame(this.animate.bind(this));
        this.intervals.push(window.setInterval(this.resyncTime.bind(this), 10));
        this.intervals.push(window.setInterval(this.resyncObjects.bind(this), 1000));
        if (!this.initialStartComplete) {
            this.initialStartInterval = window.setInterval((async () => {
                if (this.frames > 10) {
                    this.initialStartComplete = true;
                    this.target = this.world.config.initialTarget;
                    let object = await this.send<GetObjectRequest>('get-object', this.target);
                    const mesh = this.getObjectMesh(this.target);
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
        this.closeLoadingScreenInterval = window.setInterval((() => {
            if (this.frames > 1) {
                this.postMessage('close-loading-screen');
                if (this.closeLoadingScreenInterval) {
                    window.clearInterval(this.closeLoadingScreenInterval);
                }
            }
        }).bind(this), 10);
        this.intervals.push(this.closeLoadingScreenInterval);
        this.running = true;
        console.log('Expansion Loading Complete!');
    }

    async stop(): Promise<void> {
        this.running = false;
        for (const interval of this.intervals) {
            window.clearInterval(interval);
        }
        if (this.animateRequest !== null) cancelAnimationFrame(this.animateRequest);
        this.animateRequest = null;
        this.world.stop();
        await this.send<StopRequest>('stop');
        window.removeEventListener('resize', this.boundHandleResize);
        // @ts-ignore
        window.removeEventListener('click', this.boundHandleClick);
        // @ts-ignore
        window.removeEventListener('keydown', this.boundHandleKeyDown);
        window.removeEventListener('message', this.boundHandleMessage);
    }

}

export {
    Settings,
    SettingsKey,
    SettingsValue,
    defaultSettings,
    getSettings,
    Client,
}
