
import {readFileSync, writeFileSync} from 'fs';

let data = JSON.parse(readFileSync('stars.json'));

let out = data.slice(0, 2);

for (let i = 2; i < data.length; i++) {
    let [ra, dec, mag, color] = data[i];
    if (mag >= 6) {
        break;
    }
    ra = parseFloat(ra.toFixed(3));
    dec = parseFloat(dec.toFixed(3));
    out.push([ra, dec, mag, color]);
}

writeFileSync('stars_new.json', JSON.stringify(out));
