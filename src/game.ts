
import {Server} from './server.ts';
import {Client} from './client.ts';
import {defaultWorld} from './default_world.ts';

const server = new Server(defaultWorld);
const client = new Client(server.recv.bind(server), server.clientRecv.bind(server));
document.body.appendChild(client.renderer.domElement);
server.init();
server.start();
client.start();
