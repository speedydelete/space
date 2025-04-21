
import presets from './presets';


(async () => {
    // @ts-ignore
    const {Renderer, DEFAULT_SETTINGS} = await import('./renderer.ts') as typeof import('./renderer');
    let world = presets.default;
    let renderer = new Renderer(world, DEFAULT_SETTINGS);
    Object.assign(globalThis, {
        world,
        system: world.system,
        fs: world.fs,
        objDir: world.objDir,
        getObj: world.getObj.bind(world),
        setObj: world.setObj.bind(world),
        renderer,
        unitSize: renderer.unitSize,
        getObjMesh: renderer.getObjMesh.bind(renderer),
    });
    renderer.start();
})();
