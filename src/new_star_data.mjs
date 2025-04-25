
import {readFileSync, writeFileSync} from 'fs';

let stars = JSON.parse(readFileSync('src/stars.json').toString()).slice(2);

for (let i = 0; i < stars.length; i++) {
    if (stars[i][2] >= 4) {
        stars = stars.slice(0, i);
        break;
    }
}

console.log(stars.length);


let buffer = new ArrayBuffer(stars.length * 13);
console.log(buffer.byteLength);
let view = new DataView(buffer);
let offset = 0;

for (let star of stars) {
    view.setFloat32(offset, star[0], true);
    offset += 4;
    view.setFloat32(offset, star[1], true);
    offset += 4;
    view.setUint16(offset, (star[2] + 1.46) * 100, true);
    offset += 2;
    let color = star[3];
    if (color === '#7f7f7f') {
        color = '#ffffff';
    }
    let rgb = parseInt(color.slice(1), 16);
    view.setUint8(offset++, (rgb >> 16) & 0xff);
    view.setUint8(offset++, (rgb >> 8) & 0xff);
    view.setUint8(offset++, rgb & 0xff);
}

writeFileSync('src/star_data.ts', 'let data = atob(\'' + Buffer.from(buffer).toString('base64').replaceAll('//', '!').replaceAll('QP/', '@') + '\')');
