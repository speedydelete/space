
import {query, sin, cos, tan, acos, atan2, NumberInput, CheckboxInput} from './util';
import stars from './star_data';
import settings, {setSettingsKey} from './settings';


function hideExceptMain() {
    query('#about-menu').style.display = 'none';
    query('#settings-menu').style.display = 'none';
}

query('#about-menu-button').addEventListener('click', () => {
    query('#main-menu').style.display = 'none';
    query('#about-menu').style.display = 'block';
});

query('#settings-button').addEventListener('click', () => {
    query('#main-menu').style.display = 'none';
    query('#settings-menu').style.display = 'flex';
});

new NumberInput('#setting-fov', x => setSettingsKey('fov', x), settings.fov);
new NumberInput('#setting-unit-size', x => setSettingsKey('unitSize', x), settings.unitSize);
new NumberInput('#setting-camera-min-distance', x => setSettingsKey('cameraMinDistance', x), settings.cameraMinDistance);
new NumberInput('#setting-camera-max-distance', x => setSettingsKey('cameraMaxDistance', x), settings.cameraMaxDistance);
new NumberInput('#setting-controls-min-distance', x => setSettingsKey('controlsMinDistance', x), settings.controlsMinDistance);
new NumberInput('#setting-controls-max-distance', x => setSettingsKey('controlsMaxDistance', x), settings.controlsMaxDistance);
new CheckboxInput('#setting-background-stars', x => setSettingsKey('backgroundStars', x), settings.backgroundStars);
new CheckboxInput('#setting-menu-background-stars', x => setSettingsKey('menuBackgroundStars', x), settings.menuBackgroundStars);
new NumberInput('#setting-kepler-tolerance', x => setSettingsKey('keplerTolerance', x), settings.keplerTolerance);

function gotoMainMenu() {
    query('#main-menu').style.display = 'flex';
    hideExceptMain();
}

query('.main-menu-button', true).forEach(elt => {
    elt.addEventListener('click', gotoMainMenu);
});

query('#play-button').addEventListener('click', async () => {
    query('#menu').style.display = 'none';
    query('#game').style.display = 'block';
    window.removeEventListener('resize', resize);
    if (renderMenuStarsRequest) {
        cancelAnimationFrame(renderMenuStarsRequest);
    }
    if (ctx) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    // @ts-ignore
    import('./render');
    playing = true;
});


let playing = false;

let centerRa = Math.random() * 360;
let centerDec = Math.random() * 180 - 90;
let raChange = Math.random() * 2 - 1;
let decChange = Math.random() * 2 - 1;

let renderMenuStarsRequest: number | null = null;

let frames = 0;
let fps = parseInt(localStorage['space-fps'] ?? '60');
let prevRealTime = performance.now();
let blurred = false;

function multiplyColor(color: string, mul: number): string {
    const r = Math.round(parseInt(color.slice(1, 3), 16)*mul);
    const g = Math.round(parseInt(color.slice(3, 5), 16)*mul);
    const b = Math.round(parseInt(color.slice(5, 7), 16)*mul);
    return "#" + r.toString(16).padStart(2, "0") + g.toString(16).padStart(2, "0") + b.toString(16).padStart(2, "0'");
}

const limit = 7.8;

export let canvas = query<HTMLCanvasElement>('#menu-stars');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let ctx = canvas.getContext('2d');

function renderMenuStars(): void {
    if (ctx === null || playing) {
        return;
    }
    if (document.hidden || document.visibilityState === 'hidden') {
        blurred = true;
        requestAnimationFrame(renderMenuStars);
        return;
    } else if (blurred) {
        blurred = false;
        frames = 0;
        prevRealTime = performance.now();
        fps = parseInt(localStorage['space-fps']);
    }
    let realTime = performance.now();
    frames++;
    if (realTime >= prevRealTime + 1000) {
        fps = Math.round((frames * 1000)/(realTime - prevRealTime));
        frames = 0;
        prevRealTime = realTime;
        localStorage['space-fps'] = fps;
    }
    centerRa = centerRa + raChange/fps;
    if (centerRa > 360) {
        centerRa %= 360;
    }
    if (centerRa < 0) {
        centerRa += 360;
    }
    if (Math.random() < 0.01/fps) {
        raChange = Math.random() * 2 - 1;
    }
    centerDec += decChange/fps;
    if (centerDec > 90) {
        decChange = -Math.random();
        centerDec = 90;
    }
    if (centerDec < -90) {
        decChange = Math.random();
        centerDec = -90;
    }
    let scaleHeight = canvas.height / 2 / tan(10) / 180;
    let scaleWidth = canvas.width / 2 / tan(10) / 180;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!settings.menuBackgroundStars) {
        return;
    }
    for (let [ra, dec, mag, color] of stars) {
        let rho = acos((sin(centerDec)*sin(dec) + cos(centerDec)*cos(dec)*cos(ra - centerRa)));
        let theta = atan2(cos(dec)*sin(ra - centerRa), cos(centerDec)*sin(dec) - sin(centerDec)*cos(dec)*cos(ra - centerRa));
        let x = rho * sin(theta) * scaleWidth + canvas.width/2;
        let y = -rho * cos(theta) * scaleHeight + canvas.height/2;
        if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) {
            continue;
        }
        let mul = Math.min((limit - mag) / (limit + 1.46) * 0.75 + 0.25, 1);
        ctx.fillStyle = multiplyColor(color, mul);
        if (mag > limit - 3) {
            ctx.fillRect(x, y, 1, 1);
        } else if (mag > limit - 5) {
            ctx.fillRect(x, y, 2, 2);
        } else {
            ctx.fillRect(x - 1, y - 1, 3, 3);
        }
    }
    renderMenuStarsRequest = requestAnimationFrame(renderMenuStars);
}

function resize(): void {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);

window.addEventListener('load', () => {
    renderMenuStarsRequest = requestAnimationFrame(renderMenuStars);
});



