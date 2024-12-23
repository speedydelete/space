
import {Server} from './server';
import {defaultSettings, Client} from './client';
import {defaultWorld} from './default_world';

const server = new Server(defaultWorld);
const client = new Client(server.recv.bind(server), server.clientRecv.bind(server), defaultSettings);
document.body.appendChild(client.renderer.domElement);
server.init();
server.start();
client.start();
