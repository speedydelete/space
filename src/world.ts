
import create, {Process, System, UserSession, FileSystem, join} from 'fake-system';
import {Obj} from './obj';


export class World {

    system: System;
    fs: FileSystem;
    rootSession: UserSession;

    constructor(data?: Uint8Array) {
        this.system = create(data);
        this.fs = this.system.fs;
        this.rootSession = this.system.login('root');
    }

    run(command: string): Process {
        return this.rootSession.runBash(command);
    }

    read(path: string): Obj {
        return JSON.parse(this.fs.read(join('/home/objects', path)));
    }
    
    write(path: string, data: Obj): void {
        this.fs.write(join('/home/objects', path), JSON.stringify(data));
    }

}
