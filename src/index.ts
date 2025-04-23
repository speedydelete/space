
import {start} from './render';
start();

// import animateBgStars from './bg_stars';


// const TRACKS = ['ra', 'dec', '-ra', '-dec'];
// type Track = typeof TRACKS[number];

// let ra = 0;
// let dec = 0;
// let currentTrack: Track = TRACKS[Math.floor(Math.random() * 4)];

// let animateMenuRequest: number | null = null;

// let frames = 0;
// let fps = 60;
// let prevRealTime = performance.now();

// function animateMenu(): void {
//     animateBgStars(ra, dec);
//     frames++;
//     let realTime = performance.now();
//     if (realTime >= prevRealTime + 1000) {
//         fps = Math.round((frames * 1000)/(realTime - prevRealTime));
//         frames = 0;
//         prevRealTime = realTime;
//     }
//     if (currentTrack === 'ra') {
//         ra += 10/fps;
//     } else {
//         dec += 10/fps;
//     }
//     if (Math.random() < 0.1) {
//         currentTrack = currentTrack === 'ra' ? 'dec' : 'ra';
//     }
//     animateMenuRequest = requestAnimationFrame(animateMenu);
// }

// window.addEventListener('load', () => {
//     animateMenuRequest = requestAnimationFrame(animateMenu);
// });
