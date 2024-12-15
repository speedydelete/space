
import {World} from './world';
import {defaultWorld} from './default_world';

class Server {

    world: World;

    constructor() {
        this.world = defaultWorld;
    }

}

export {
    Server,
}
