
import config from './config.js';

function rotateObjects(objects, timeWarp) {
    for (const object of objects) {
        console.log(timeWarp/object.rotationPeriod * config.rotateInterval);
        if (object.rotationPeriod) object.mesh.rotation.y += timeWarp/object.rotationPeriod * config.rotateInterval;
        rotateObjects(object.children, timeWarp);
    }
}

export {
    rotateObjects,
}
