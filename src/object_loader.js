
import * as three from 'three';

function addObject(object, pos = [0, 0, 0], root = true) {
    if (typeof object.color == 'string') object.color = parseInt(object.color);
    if (!(root)) {
        pos[2] += object.orbit.ap;
    }
    let material;
    if (object.texture) {
        material = new three.MeshStandardMaterial({map: textureLoader.load(object.texture)});
    }
    if (object.type == 'star') {
        material.emissiveMap = textureLoader.load(object.texture);
        material.emissive = new three.Color().setRGB(
            Math.floor(object.color / 65536)/255,
            Math.floor((object.color % 65536) / 256)/255,
            Math.floor(object.color % 256)/256
        );
        material.emissiveIntensity = 2;
    }
    const geometry = new three.SphereGeometry(object.radius, 512, 512);
    const mesh = new three.Mesh(geometry, material);
    mesh.position.set(...pos);
    if (object.type == 'star') {
        const light = new three.PointLight(object.color);
        light.power = config.luminosityConstant / 10**(0.4 * object.mag);
        light.power /= 20000; // hotfix
        mesh.add(light);
    }
    scene.add(mesh);
    object.mesh = mesh;
    if (object.children) {
        for (let i = 0; i < object.children.length; i++) {
            object.children[i] = addObject(object.children[i], pos.slice(), false);
        }
    }
    return object;
}

async function loadObjects() {
    const objects = await (await fetch('objects.json')).json();
    for (let i = 0; i < objects.length; i++) {
        objects[i] = addObject(objects[i]);
    }
    return objects;
}

export {
    loadObjects,
}
