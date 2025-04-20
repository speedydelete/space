
import {getPresetIndex, loadPreset} from './preset_loader';
import {Server} from './server';
import {Client} from './client';


(async () => {
    let preset = (await getPresetIndex()).find(x => x.default);
    if (!preset) {
        throw new Error('No default preset');
    }
    let server = new Server(await loadPreset(preset));
    let client = new Client(server.recv, server.clientRecv, 0, () => {}, () => {}, async () => {});
    server.start();
    client.start();
})();
