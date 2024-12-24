
import type {ReactNode, RefObject} from 'react';
import React, {useRef, useState, useEffect, useContext, createContext} from 'react';

interface WorldInfo {
    name: string,
    desc: string,
    thumbnail?: string,
}

const MenuContext = createContext({
    menu: 'main',
    setMenu: (menu: string): void => {},
    enterWorld: (world: WorldInfo): void => {},
    resume: (): void => {},
    saveAndQuitToTitle: ():  void => {},
});

const starSizes: number[] = [1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3];
const starColors: string[] = Object.values({...await (await fetch('./data/spectral_type_colors.json')).json(), info: undefined, '~': undefined}).filter((x): x is string => x !== undefined);

function StarCanvas(): ReactNode {
    let canvasRef: RefObject<null | HTMLCanvasElement> = useRef(null);
    let requestRef: RefObject<number | null> = useRef(null);
    function animate(ctx: CanvasRenderingContext2D, fakeCtx: CanvasRenderingContext2D): void {
        const {width, height}: {width: number, height: number} = ctx.canvas;
        fakeCtx.clearRect(0, 0, width, height);
        fakeCtx.drawImage(ctx.canvas, 0, 0);
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(fakeCtx.canvas, 0, height - 1, width, 1, 0, 0, width, 1);
        ctx.drawImage(fakeCtx.canvas, 0, 0, width, height - 1, 0, 1, width, height - 1);
        requestRef.current = requestAnimationFrame(() => animate(ctx, fakeCtx));
    }
    function setup(ctx: CanvasRenderingContext2D, fakeCtx: CanvasRenderingContext2D): void {
        ctx.canvas.width = fakeCtx.canvas.width = window.innerWidth;
        ctx.canvas.height = fakeCtx.canvas.height = window.innerHeight;
        for (let x = 0; x < window.innerWidth; x++) {
            ctx.fillStyle = starColors[Math.floor(Math.random() * starColors.length)];
            const y: number = Math.floor(Math.random() * window.innerHeight);
            const size: number = starSizes[Math.floor(Math.random() * starSizes.length)];
            ctx.fillRect(x, y, size, size);
        }
    }
    useEffect((): (() => void) => {
        // @ts-ignore
        let ctx: CanvasRenderingContext2D = canvasRef.current.getContext('2d');
        // @ts-ignore
        let fakeCtx: CanvasRenderingContext2D = document.createElement('canvas').getContext('2d');
        setup(ctx, fakeCtx);
        requestRef.current = requestAnimationFrame(() => animate(ctx, fakeCtx));
        const setupResizeFunc = () => setup(ctx, fakeCtx);
        window.addEventListener('resize', setupResizeFunc);
        return (): void => {
            if (requestRef.current !== null) {
                cancelAnimationFrame(requestRef.current);
            }
            window.removeEventListener('resize', setupResizeFunc);
        };
    }, []);
    return (
        <canvas ref={canvasRef}></canvas>
    );
}

function SwitchMenuButton({menu, children}: {menu: string, children: ReactNode}) {
    const setMenu = useContext(MenuContext).setMenu;
    return <button onClick={() => setMenu(menu)}>{children}</button>;
}

function MenuSection({name, children}: {name: string, children: ReactNode}): ReactNode {
    const menu = useContext(MenuContext).menu;
    return menu == name && <div className='menu-section'>{children}</div>;
}

function Settings(): ReactNode {
    return (
        <MenuSection name='settings'>
            <SwitchMenuButton menu='main'>Back</SwitchMenuButton>
        </MenuSection>
    );
}

function MenuWorld({world}: {world: WorldInfo}): ReactNode {
    const enterWorld = useContext(MenuContext).enterWorld;
    let thumbnail = world.thumbnail;
    let style = {};
    if (thumbnail === undefined) {
        thumbnail = 'data/img/pack.png';
        style = {filter: 'grayscale(100%)'};
    }
    return (
        <div className='menu-world'>
            <div onClick={() => enterWorld(world)}>
                <img src={thumbnail} style={style} />
                <img className="enter-arrow" src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' preserveAspectRatio='none' viewBox='0 0 16 16'><polygon points='8,2 8,14 14,8' style='fill: white;' /></svg>" />
            </div>
            <div>
                <div>{world.name}</div>
                <div className='menu-world-desc'>{world.desc}</div>
            </div>
        </div>
    );
}//data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==

function WorldSelection({children}: {children: ReactNode}): ReactNode {
    return <div className='menu-worlds'>{children}</div>;
}

function WorldSelectionBottom({children}: {children: ReactNode}): ReactNode {
    return <div className='menu-worlds-bottom'>{children}</div>;
}

function SingleplayerMenu({worlds}: {worlds: WorldInfo[]}): ReactNode {
    return (
        <MenuSection name='singleplayer'>
            <WorldSelection>
                {worlds.map((world: WorldInfo, i: number) => <MenuWorld world={world} key={i} />)}
            </WorldSelection>
            <WorldSelectionBottom>
                <button>Play Selected World</button>
                <button>Create New World</button>
                <button>Edit</button>
                <button>Delete</button>
                <SwitchMenuButton menu='main'>Cancel</SwitchMenuButton>
            </WorldSelectionBottom>
        </MenuSection>
    );
}

function MultiplayerMenu(): ReactNode {
    return (
        <MenuSection name='multiplayer'>
            <WorldSelectionBottom>
                <SwitchMenuButton menu='main'>Cancel</SwitchMenuButton>
            </WorldSelectionBottom>
        </MenuSection>
    );
}

function About(): ReactNode {
    return (
        <MenuSection name='about'>
            <div className='lower-left'><SwitchMenuButton menu='main'>Back</SwitchMenuButton></div>
            <div className='menu-about'>
                <h1>About</h1>
                Space is an open-source space simulation game licensed under the <a href="https://www.gnu.org/licenses/gpl-3.0.en.html#license-text">GPLv3.0</a>. Here is its <a href="https://github.com/speedydelete/space">GitHub</a>.
                <br />
                <br />
                <h2>Version History</h2>
                <ul>
                    <li>v0.3.1 - 2024-12-23
                        <ul>
                            <li>Fixed the lag.</li>
                        </ul>
                    </li>
                    <li>v0.3.0 - 2024-12-22
                        <ul>
                            <li>Added a lot more objects.</li>
                            <li>Added movement using the [ and ] keys.</li>
                            <li>Added an about page.</li>
                        </ul>
                    </li>
                    <li>v0.2.0 - 2024-12-15
                        <ul>
                            <li>Added a menu.</li>
                        </ul>
                    </li>
                    <li>
                        v0.1.0 - 2024-12-06
                        <ul>
                            <li>3D rendering of the Sun, Earth, and the Moon.</li>
                            <li>Shows a bunch of information on the screen.</li>
                            <li>Can be interacted with (panning, zooming, clicking) using the mouse.</li>
                            <li>Time warp controlled using comma, period, and slash keys.</li>
                        </ul>
                    </li>
                </ul>
                <h2>Credits</h2>
                <ul>
                    <li>
                        These textures are from <a href="https://solarsystemscope.com/">solarsystemscope.com</a>. They were created by <a href="http://inove.eu.com/">INOVE</a> and are licensed under the <a href="https://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License.</a>
                        <ul>
                            <li><a href="data/textures/ssc/sun.jpg">sun.jpg</a></li>
                            <li><a href="data/textures/ssc/sun_8k.jpg">sun_8k.jpg</a></li>
                            <li><a href="data/textures/ssc/mercury.jpg">mercury.jpg</a></li>
                            <li><a href="data/textures/ssc/mercury_8k.jpg">mercury_8k.jpg</a></li>
                            <li><a href="data/textures/ssc/venus_atmosphere.jpg">venus_atmosphere.jpg</a></li>
                            <li><a href="data/textures/ssc/venus_atmosphere_4k.jpg">venus_atmosphere_4k.jpg</a></li>
                            <li><a href="data/textures/ssc/earth.jpg">earth.jpg</a></li>
                            <li><a href="data/textures/ssc/earth_8k.jpg">earth_8k.jpg</a></li>
                            <li><a href="data/textures/ssc/moon.jpg">moon.jpg</a></li>
                            <li><a href="data/textures/ssc/moon_8k.jpg">moon_8k.jpg</a></li>
                            <li><a href="data/textures/ssc/mars.jpg">mars.jpg</a></li>
                            <li><a href="data/textures/ssc/mars_8k.jpg">mars_8k.jpg</a></li>
                            <li><a href="data/textures/ssc/jupiter.jpg">jupiter.jpg</a></li>
                            <li><a href="data/textures/ssc/jupiter_8k.jpg">jupiter_8k.jpg</a></li>
                            <li><a href="data/textures/ssc/saturn.jpg">saturn.jpg</a></li>
                            <li><a href="data/textures/ssc/saturn_8k.jpg">saturn_8k.jpg</a></li>
                            <li><a href="data/textures/ssc/uranus.jpg">uranus.jpg</a></li>
                            <li><a href="data/textures/ssc/neptune.jpg">neptune.jpg</a></li>
                        </ul>
                    </li>
                    <li>
                        These textures are from <a href="https://github.com/nasa/NASA-3D-Resources/">NASA</a> and are provided without copyright.
                        <ul>
                            <li><a href="data/textures/nasa/phobos.jpg">phobos.jpg</a></li>
                            <li><a href="data/textures/nasa/deimos.jpg">deimos.jpg</a></li>
                            <li><a href="data/textures/nasa/io.jpg">io.jpg</a></li>
                            <li><a href="data/textures/nasa/europa.jpg">europa.jpg</a></li>
                            <li><a href="data/textures/nasa/ganymede.jpg">ganymede.jpg</a></li>
                            <li><a href="data/textures/nasa/callisto.jpg">callisto.jpg</a></li>
                            <li><a href="data/textures/nasa/mimas.jpg">mimas.jpg</a></li>
                            <li><a href="data/textures/nasa/enceladus.jpg">enceladus.jpg</a></li>
                            <li><a href="data/textures/nasa/tethys.jpg">tethys.jpg</a></li>
                            <li><a href="data/textures/nasa/dione.jpg">dione.jpg</a></li>
                            <li><a href="data/textures/nasa/rhea.jpg">rhea.jpg</a></li>
                            <li><a href="data/textures/nasa/titan.jpg">titan.jpg</a></li>
                            <li><a href="data/textures/nasa/iapetus.jpg">iapetus.jpg</a></li>
                            <li><a href="data/textures/nasa/ariel.jpg">ariel.jpg</a></li>
                            <li><a href="data/textures/nasa/umbriel.jpg">umbriel.jpg</a></li>
                            <li><a href="data/textures/nasa/titania.jpg">titania.jpg</a></li>
                            <li><a href="data/textures/nasa/oberon.jpg">oberon.jpg</a></li>
                            <li><a href="data/textures/nasa/miranda.jpg">miranda.jpg</a></li>
                            <li><a href="data/textures/nasa/triton.jpg">triton.jpg</a></li>
                            <li><a href="data/textures/nasa/pluto.jpg">pluto.jpg</a></li>
                            <li><a href="data/textures/nasa/charon.jpg">charon.jpg</a></li>
                        </ul>
                    </li>
                </ul>
            </div>
        </MenuSection>
    );
}

function EscapeMenu(): ReactNode {
    const {resume, saveAndQuitToTitle} = useContext(MenuContext);
    return (
        <MenuSection name='escape'>
            <div className='menu-escape'>
                <button onClick={resume}>Back to Game</button>
                <SwitchMenuButton menu='settings'>Options</SwitchMenuButton>
                <button onClick={saveAndQuitToTitle}>Save and Quit to Title</button>
            </div>
        </MenuSection>
    );
}

function MainMenu(): ReactNode {
    return (
        <MenuSection name='main'>
            <div className='menu-main'>
                <div className='title'>Space</div>
                <SwitchMenuButton menu='singleplayer'>Singleplayer</SwitchMenuButton>
                <SwitchMenuButton menu='multiplayer'>Multiplayer</SwitchMenuButton>
                <SwitchMenuButton menu='settings'>Settings</SwitchMenuButton>
                <SwitchMenuButton menu='about'>About</SwitchMenuButton>
                <div className='small-text lower-left'>v0.4.0</div>
            </div>
        </MenuSection>
    )
}

function Menu({worlds, enterWorld, resume, saveAndQuitToTitle, menu, setMenu, showStars}: {worlds: WorldInfo[], enterWorld: (world: WorldInfo) => void, resume, saveAndQuitToTitle, menu: string, setMenu: (menu: string) => void, showStars?: boolean}): ReactNode {
    if (showStars === undefined) showStars = true;
    const contextData = {
        menu: menu,
        setMenu: setMenu,
        enterWorld: enterWorld,
        resume: resume,
        saveAndQuitToTitle: saveAndQuitToTitle,
    };
    return (
        <div className='menu'>
            {showStars && <StarCanvas />}
            <MenuContext.Provider value={contextData}>
                <MainMenu />
                <SingleplayerMenu worlds={worlds} />
                <MultiplayerMenu />
                <Settings />
                <About />
                <EscapeMenu />
            </MenuContext.Provider>
        </div>
    );
}

export {
    WorldInfo,
    Menu,
}
