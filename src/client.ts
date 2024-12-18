
import * as three from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import * as util from './util';
import type {Obj} from './obj';
import type {GetTimeRequest, GetTimeWarpRequest, GetObjectRequest, GetAllObjectsRequest, GetAllObjectPathsRequest, GetObjectCountRequest, GetConfigRequest, StartRequest, StopRequest, Request, ResponseForRequest, SentRequest, SentResponse, SetTimeWarpRequest} from './server';

class Client {

    syncSend: (data: SentRequest) => void;
    syncRecv: () => SentResponse[];
    waitingMsgs: {[key: number]: (value: any) => void} = {};
    nextMsgId: number = 0;

    unitSize: number = 150000000000;
    target: string = 'sun/earth';

    renderer: three.WebGLRenderer;
    scene: three.Scene;
    camera: three.PerspectiveCamera;
    controls: OrbitControls;
    raycaster: three.Raycaster;
    objMeshes: {[key: string]: three.Mesh} = {};

    changelogElt: HTMLElement | null;
    changelogShown: boolean = false;

    leftInfoElt: HTMLElement | null;
    rightInfoElt: HTMLElement | null;

    oldMeshPos: three.Vector3 = new three.Vector3(0, 0, 0);

    frames: number = 0;
    prevRealTime: number = performance.now();
    fps: number = 60;
    blurred: boolean = false;
    request: null | number = null;
    running: boolean = false;
    initialStartComplete: boolean = false;
    
    boundHandleResize: (event: Event) => void;
    boundHandleClick: (event: MouseEvent) => void;
    boundHandleKeyDown: (event: KeyboardEvent) => void;
    boundHandleMessage: (event: MessageEvent) => void;

    constructor(send: (data: SentRequest) => void, recv: () => SentResponse[]) {
        this.syncSend = send;
        this.syncRecv = recv;
        this.renderer = new three.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.scene = new three.Scene();
        this.camera = new three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.0000000000001, 100000000000000);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.minDistance = 0.0000000000001;
        this.controls.maxDistance = 100000000000000;
        this.controls.keys = {LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', BOTTOM: 'ArrowDown'}
        this.controls.keyPanSpeed = 2;
        this.controls.update();
        this.controls.listenToKeyEvents(window);
        this.scene.add(new three.AmbientLight(0xffffff, 0.2));
        this.raycaster = new three.Raycaster();
        this.changelogElt = document.getElementById('changelog');
        this.leftInfoElt = document.getElementById('left-info');
        this.rightInfoElt = document.getElementById('right-info');
        this.boundHandleResize = this.handleResize.bind(this);
        this.boundHandleClick = this.handleClick.bind(this);
        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        this.boundHandleMessage = this.handleMessage.bind(this);
        this.loadObjects();
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
        this.nextMsgId++;
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
            this.target = Object.entries(this.objMeshes).filter((x) => x[1] == intersects[0].object)[0][0];
            this.controls.target.copy(intersects[0].object.position);
        }
    };

    async handleKeyDown(event: KeyboardEvent): Promise<void> {
        if (event.key == ',') {
            event.preventDefault();
            let timeWarp: number =(await this.send<GetTimeWarpRequest>('get-time-warp'));
            if (Math.log10(timeWarp) % 1 === 0) {
                timeWarp /= 2;
            } else {
                timeWarp /= 5;
            }
            this.send<SetTimeWarpRequest>('set-time-warp', timeWarp);
        } else if (event.key == '.') {
            event.preventDefault();
            let timeWarp: number = await this.send<GetTimeWarpRequest>('get-time-warp');
            if (Math.log10(timeWarp) % 1 === 0) {
                timeWarp *= 5;
            } else {
                timeWarp *= 2;
            }
            this.send<SetTimeWarpRequest>('set-time-warp', timeWarp);
        } else if (event.key == '/') {
            event.preventDefault();
            this.send<SetTimeWarpRequest>('set-time-warp', 1);
        } else if (event.key == 'c' && this.changelogElt) {
            event.preventDefault();
            this.changelogShown = !this.changelogShown;
            if (this.changelogShown) {
                this.changelogElt.style.display = 'block';
                if (this.leftInfoElt) this.leftInfoElt.style.display = 'none';
                if (this.rightInfoElt) this.rightInfoElt.style.display = 'none';
            } else {
                this.changelogElt.style.display = 'none';
                if (this.leftInfoElt) this.leftInfoElt.style.display = 'block';
                if (this.rightInfoElt) this.rightInfoElt.style.display = 'block';
            }
        } else if (event.key == 'Escape' && window.top) {
            window.top.postMessage({
                isSpace: true,
                type: 'escape',
            }, origin);
        }
    };

    handleMessage(event: MessageEvent): void {
        if (event.source === window.top && event.data.isSpace === true) {
            const {type} = event.data;
            if (type == 'start') {
                this.start();
            } else if (type == 'stop') {
                this.stop();
            }
        }
    }

    async loadObjects(): Promise<void> {
        const textureLoader = new three.TextureLoader();
        const lC: number = await this.send<GetConfigRequest>('get-config', 'lC');
        for (const {path, object} of await this.send<GetAllObjectsRequest>('get-all-objects')) {
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
            const geometry = new three.SphereGeometry(object.radius/this.unitSize, 512, 512);
            const mesh = new three.Mesh(geometry, material);
            mesh.position.set(...object.position);
            if (object.type == 'star') {
                const light = new three.PointLight(object.color);
                light.power = lC / 10**(0.4 * object.magnitude) / this.unitSize**2 / 20000;
                light.castShadow = true;
                mesh.add(light);
            }
            mesh.visible = true;
            this.scene.add(mesh);
            this.objMeshes[path] = mesh;
        }
    }

    async animate(): Promise<void> {
        this.checkMessages();
        if (document.hidden || document.visibilityState == 'hidden') {
            this.blurred = true;
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
        const targetObj: Obj | undefined = await this.send<GetObjectRequest>('get-object', this.target);
        const mesh: three.Mesh | undefined = this.getObjectMesh(this.target);
        if (mesh && mesh.position) {
            this.camera.position.x += mesh.position.x - this.oldMeshPos.x;
            this.camera.position.y += mesh.position.y - this.oldMeshPos.y;
            this.camera.position.z += mesh.position.z - this.oldMeshPos.z;
            this.controls.target.copy(mesh.position);
        }
        if (this.leftInfoElt) {
            const time = await this.send<GetTimeRequest>('get-time');
            const timeWarp = await this.send<GetTimeWarpRequest>('get-time-warp');
            this.leftInfoElt.innerText = `FPS: ${this.fps}
            Camera X: ${util.formatLength(this.camera.position.x*this.unitSize)}
            Camera Y: ${util.formatLength(this.camera.position.y*this.unitSize)}
            Camera Z: ${util.formatLength(this.camera.position.z*this.unitSize)}
            Total Objects: ${await this.send<GetObjectCountRequest>('get-object-count')}
            Time: ${time ? util.formatDate(time) : 'undefined'}
            Time Warp: ${timeWarp}x (${util.formatTime(timeWarp)}/s)
            Down C for changelog.
            Use ,./ to control time warp.
            Click on objects to select them.`;
        }
        if (this.rightInfoElt && targetObj !== undefined && mesh !== undefined) {
            this.rightInfoElt.innerText = `Path: ${this.target}
            Name: ${targetObj.name}
            X: ${util.formatLength(mesh.position.x*this.unitSize)}
            Y: ${util.formatLength(mesh.position.y*this.unitSize)}
            Z: ${util.formatLength(mesh.position.z*this.unitSize)}\n` + (targetObj.orbit ? 
            `\tApoapsis: ${util.formatLength(targetObj.orbit.ap)}
            \tPeriapsis: ${util.formatLength(targetObj.orbit.pe)}
            \tEccentricity: ${targetObj.orbit.ecc}
            \tPeriod: ${util.formatTime(targetObj.orbit.period)}
            \tInclination: ${targetObj.orbit.inc}\xb0
            \tLongitude of Ascending Node: ${targetObj.orbit.lan}\xb0
            \tArgument of Periapsis: ${targetObj.orbit.aop}\xb0
            \tTime of Periapsis: ${targetObj.orbit.top}`
            : `No orbit, root object`);
        }
        this.camera.updateProjectionMatrix();
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        if (mesh) this.oldMeshPos = mesh.position.clone();
        this.request = requestAnimationFrame(this.animate.bind(this));
    }

    async start(): Promise<void> {
        if (!this.initialStartComplete) {
            setTimeout(async () => {
                const object: Obj = await this.send<GetObjectRequest>('get-object', this.target);
                const mesh = this.getObjectMesh(this.target);
                if (object && mesh) {
                    this.camera.position.set(mesh.position.x + object.radius/this.unitSize*10, mesh.position.y, mesh.position.z);
                }
            }, 1000);
        }
        window.addEventListener('resize', this.boundHandleResize);
        window.addEventListener('click', this.boundHandleClick);
        window.addEventListener('keydown', this.boundHandleKeyDown);
        window.addEventListener('message', this.boundHandleMessage);
        this.request = requestAnimationFrame(this.animate.bind(this));
        await this.send<StartRequest>('start');
        this.running = true;
    }

    async stop(): Promise<void> {
        this.running = false;
        if (this.request !== null) cancelAnimationFrame(this.request);
        this.request = null;
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
    Client,
}
