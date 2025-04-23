
import renderBgStars from './bg_stars';


let ra = Math.random() * 360;
let dec = Math.random() * 180 - 90;
let decChange = Math.random() * 2 - 1;

let animateMenuRequest: number | null = null;

let frames = 0;
let fps = parseInt(localStorage['space-fps'] ?? '60');
let prevRealTime = performance.now();
let blurred = false;

function animateMenu(): void {
    if (document.hidden || document.visibilityState === 'hidden') {
        blurred = true;
        requestAnimationFrame(animateMenu);
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
    ra = (ra + 1/fps) % 360;
    dec += decChange/fps;
    if (dec > 90) {
        decChange = -Math.random();
        dec = 90;
    }
    if (dec < -90) {
        decChange = Math.random();
        dec = -90;
    }
    renderBgStars(ra, dec);
    animateMenuRequest = requestAnimationFrame(animateMenu);
}

window.addEventListener('load', () => {
    animateMenuRequest = requestAnimationFrame(animateMenu);
});
