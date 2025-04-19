
import create, {Process, System, UserSession} from 'fake-system';


export class World {

    system: System;
    rootSession: UserSession;

    constructor(data?: Uint8Array) {
        this.system = create(data);
        this.rootSession = this.system.login('root');
    }

    run(command: string): Process {
        return this.rootSession.runBash(command);
    }

}
