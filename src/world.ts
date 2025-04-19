
import {System} from 'fake-system';


export class World {

    system: System;

    constructor(data?: ArrayBuffer) {
        this.system = new System();
        if (data) {

        }
    }

}
