
function rotateObjects(objects, timeWarp) {
    for (const object of objects) {
        if (object.rotationPeriod) object.mesh.rotation.y += timeWarp/object.rotationPeriod;
        if (object.children) rotateObjects(object.children, timeWarp);
    }
}

export {
    rotateObjects,
}
