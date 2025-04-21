
import {getPresetIndex, loadPreset} from './preset_loader';
import {Renderer, DEFAULT_SETTINGS} from './renderer';


(async () => {
    let preset = (await getPresetIndex()).find(x => x.default);
    if (!preset) {
        throw new Error('No default preset');
    }
    let world = await loadPreset(preset);
    world.config = {
        tps: 20,
        c: 299792458,
        G: 6.6743e-11,
        lC: 3.2065e+30,
        initialTarget: 'sun',
    };
    let renderer = new Renderer(world, DEFAULT_SETTINGS);
    Object.assign(globalThis, {
        world,
        system: world.system,
        fs: world.fs,
        objDir: world.objDir,
        renderer,
    });
    renderer.start();
})();
