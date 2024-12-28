
import {Server} from './server.ts';
import {Client} from './client.ts';
import {solarSystemWorld} from './presets.ts';

const server = new Server(solarSystemWorld);
const client = new Client(server.recv.bind(server), server.clientRecv.bind(server));
document.body.appendChild(client.renderer.domElement);
server.init();
server.start();
client.start();
