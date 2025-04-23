
import STARS from './stars.json';


const {PI: pi} = Math;
const sin = (x: number) => Math.sin(x * pi / 180);
const cos = (x: number) => Math.cos(x * pi / 180);
const asin = (x: number) => Math.asin(x) * 180 / pi;
const acos = (x: number) => Math.acos(x) * 180 / pi;
const atan2 = (x: number, y: number) => Math.atan2(x, y) * 180 / pi;

function multiplyColor(color: string, mul: number): string {
    const r = Math.round(parseInt(color.slice(1, 3), 16)*mul);
    const g = Math.round(parseInt(color.slice(3, 5), 16)*mul);
    const b = Math.round(parseInt(color.slice(5, 7), 16)*mul);
    return "#" + r.toString(16).padStart(2, "0") + g.toString(16).padStart(2, "0") + b.toString(16).padStart(2, "0'");
}

let limit = 7.8;
let scale = window.innerHeight * pi / 180 * (90 / 70);


interface Star {
    ra: number;
    dec: number;
    mag: number;
    color: string;
}

let stars: Star[] = [];

for (let star of (STARS as [number, number, number, string][]).slice(2)) {
    stars.push({ra: star[0], dec: star[1], mag: star[2], color: star[3]});
}


let canvas = document.getElementById('bg-stars') as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

export default function render(centerRa: number, centerDec: number): [number, number] {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let star of stars) {
        let {ra, dec, mag, color} = star;
        if (mag > limit) {
            continue;
        }
        let rho = acos((sin(centerDec)*sin(dec) + cos(centerDec)*cos(dec)*cos(ra - centerRa)));
        let theta = atan2(cos(dec)*sin(ra - centerRa), cos(centerDec)*sin(dec) - sin(centerDec)*cos(dec)*cos(ra - centerRa));
        let x = rho * sin(theta) * scale + canvas.width/2;
        let y = rho * cos(theta) * scale + canvas.height/2;
        if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) {
            continue;
        }
        // let mul = -2.5 * Math.log10(mag / 6) / (limit + 1.46);
        let mul = (limit - mag) / (limit + 1.46) * 0.75 + 0.25;
        if (mul > 1) {
            mul = 1;
        }
        ctx.fillStyle = multiplyColor(color, mul);
        if (mag > limit - 3) {
            ctx.fillRect(x, y, 1, 1);
        } else if (mag > limit - 5) {
            ctx.fillRect(x, y, 2, 2);
        } else {
            ctx.fillRect(x - 1, y - 1, 3, 3);
        }
    }
    return [centerRa, centerDec];
}
