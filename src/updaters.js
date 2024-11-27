
import {getPosition} from './orbits.js';

function rotateObjects(objects, timeWarp) {
    for (const object of objects) {
        if (object.rotationPeriod) object.mesh.rotation.y += timeWarp/object.rotationPeriod;
        if (object.children) rotateObjects(object.children, timeWarp);
    }
}

function moveObjects(objects, time, parent = null) {
    for (const object of objects) {
        if (parent !== null) {
            const [z, x, y] = getPosition(object, parent, time);
            const [px, py, pz] = parent.mesh.position;
            object.mesh.position.set(px + x, py + y, pz + z);
        }
        if (object.children) moveObjects(object.children, time, object);
    }
}

export {
    rotateObjects,
    moveObjects,
}
