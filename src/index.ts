
import renderBgStars from './bg_stars';


let mainMenu = document.getElementById('main-menu') as HTMLDivElement;
let aboutMenu = document.getElementById('about-menu') as HTMLDivElement;

function hideExceptMain() {
    aboutMenu.style.display = 'none';
}

document.getElementById('about-menu-button')?.addEventListener('click', () => {
    mainMenu.style.display = 'none';
    aboutMenu.style.display = 'block';
});

function gotoMainMenu() {
    mainMenu.style.display = 'flex';
    hideExceptMain();
}
document.querySelectorAll('.main-menu-button').forEach(elt => elt.addEventListener('click', gotoMainMenu));

document.getElementById('settings-button')?.addEventListener('click', () => alert('Sorry, no settings yet!'));

document.getElementById('play-button')?.addEventListener('click', async () => {
    (document.getElementById('menu') as HTMLDivElement).style.display = 'none';
    (document.getElementById('game') as HTMLDivElement).style.display = 'block';
    // @ts-ignore
    let {start} = await import('./render') as typeof import('./render');
    start();
    playing = true;
});


let playing = false;

let ra = Math.random() * 360;
let dec = Math.random() * 180 - 90;
let raChange = Math.random() * 2 - 1;
let decChange = Math.random() * 2 - 1;

let animateMenuRequest: number | null = null;

let frames = 0;
let fps = parseInt(localStorage['space-fps'] ?? '60');
let prevRealTime = performance.now();
let blurred = false;

function animateMenu(): void {
    if (playing) {
        return;
    }
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
    ra = ra + raChange/fps;
    if (ra > 360) {
        ra = 360;
        raChange = -Math.random();
    }
    if (ra < 0) {
        ra = 0;
        raChange = Math.random();
    }
    dec += decChange/fps;
    if (dec > 90) {
        decChange = -Math.random();
        dec = 90;
    }
    if (dec < -90) {
        decChange = -Math.random();
        dec = -90;
    }
    renderBgStars(ra, dec);
    animateMenuRequest = requestAnimationFrame(animateMenu);
}

window.addEventListener('load', () => {
    animateMenuRequest = requestAnimationFrame(animateMenu);
});
