
import * as three from 'three';
import {config} from './config.js';

const textureLoader = new three.TextureLoader();

function getObjectCount(objects) {
    let children = 0;
    for (const object of objects) {
        if (object.children) children += getObjectCount(object.children);
    }
    return objects.length + children;
}

function addObject(object, scene, pos = [0, 0, 0]) {
    if (typeof object.color == 'string') object.color = parseInt(object.color);
    let material;
    if (object.texture) {
        material = new three.MeshStandardMaterial({map: textureLoader.load(object.texture)});
        material.opacity = 1;
        material.transparent = false;
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
    const geometry = new three.SphereGeometry(object.radius/config.unitSize, 512, 512);
    const mesh = new three.Mesh(geometry, material);
    mesh.opacity = 1;
    mesh.transparent = false;
    mesh.position.set(...pos);
    if (object.type == 'star') {
        const light = new three.PointLight(object.color);
        light.power = config.luminosityConstant / 10**(0.4 * object.mag) / config.unitSize**2;
        console.log(light.power);
        light.power = 0;
        mesh.add(light);
    }
    mesh.visible = true;
    scene.add(mesh);
    object.mesh = mesh;
    if (object.children) {
        for (let i = 0; i < object.children.length; i++) {
            object.children[i] = addObject(object.children[i], scene, pos.slice(), false);
        }
    }
    return object;
}

async function loadObjects(scene) {
    const objects = await (await fetch('objects.json')).json();
    for (let i = 0; i < objects.length; i++) {
        objects[i] = addObject(objects[i], scene);
    }
    return objects;
}

function getObjectMap(objects, name = '') {
    let out = {};
    for (const object of objects) {
        const key = (name ? name + '.' : '') + object.name;
        out[key] = object;
        object.key = key;
        object.mesh.name = key;
        if (object.children) out = {...out, ...getObjectMap(object.children, key)};
    }
    return out;
}

export {
    getObjectCount,
    loadObjects,
    getObjectMap,
}
