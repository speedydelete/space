
import {World} from './world.ts';
import {Server} from './server.ts';
import {Client} from './client.ts';

window.addEventListener('message', async (event) => {
    console.log(event);
    console.log(event.origin, event.data);
    if (event.origin === origin && event.data.isSpace && event.data.type === 'init') {
        console.log('initing');
        const server = new Server(await World.import(event.data.data));
        const client = new Client(server.recv.bind(server), server.clientRecv.bind(server));
        document.body.appendChild(client.renderer.domElement);
        server.init();
        server.start();
        client.start();
    }
});

console.log('listener added');
