
import create, {Process, System, UserSession, FileSystem, join, Directory} from 'fake-system';
import {Obj, RootObj} from './obj';


export interface Config {
    tps: number,
    c: number,
    G: number,
    lC: number,
    initialTarget: string,
}


export class World {

    system: System;
    fs: FileSystem;
    objDir: Directory;
    rootSession: UserSession;

    time: number = 0;
    timeWarp: number = 1;

    constructor(data?: Uint8Array) {
        this.system = create(data);
        this.fs = this.system.fs;
        if (!this.fs.exists('/home/objects')) {
            this.fs.mkdir('/home/objects');
        }
        this.objDir = this.fs.getDir('/home/objects');
        this.rootSession = this.system.login('root');
        if (!this.objDir.exists('.object')) {
            this.objDir.write('.object', JSON.stringify(new RootObj('', 'special:root')));
        }
    }

    run(command: string): Process {
        return this.rootSession.runBash(command);
    }

    getObj(path: string): Obj {
        return JSON.parse(this.objDir.read(join(path, '.object')));
    }
    
    setObj(path: string, data: Obj): void {
        if (!this.objDir.exists(path)) {
            this.objDir.mkdir(path, true);
        }
        this.objDir.write(join(path, '.object'), JSON.stringify(data));
    }

    getObjPaths(start: string, recursive: boolean = false): string[] {
        let out: string[] = [];
        for (let [name, file] of this.objDir.getDir(start).files) {
            out.push(name);
            if (file instanceof Directory && recursive) {
                this.getObjPaths(join(start, name), true);
            }
        }
        return out;
    }

    get config(): Config {
        return JSON.parse(this.fs.read('/etc/config'));
    }

    set config(value: Config) {
        this.fs.write('/etc/config', JSON.stringify(value));
    }

    saveState(): void {
        this.fs.write('/etc/time', this.time.toString());
        this.fs.write('/etc/time_warp', this.timeWarp.toString());
    }

    init(): void {

    }

    start(): void {

    }

    stop(): void {

    }

    export(): Uint8Array {
        return this.system.export();
    }

}
