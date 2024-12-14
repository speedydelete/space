
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
    enterWorld: (world: WorldInfo) => {},
    resume: () => {},
});

const starSizes: number[] = [1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3];
const starColors: string[] = Object.values({...await (await fetch('spectral_type_colors.json')).json(), info: undefined, '~': undefined});

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
    useEffect((): (() => void) => {
        // @ts-ignore
        let ctx: CanvasRenderingContext2D = canvasRef.current.getContext('2d');
        // @ts-ignore
        let fakeCtx: CanvasRenderingContext2D = document.createElement('canvas').getContext('2d');
        ctx.fillStyle = 'black';
        ctx.canvas.width = fakeCtx.canvas.width = window.innerWidth;
        ctx.canvas.height = fakeCtx.canvas.height = window.innerHeight;
        for (let x = 0; x < window.innerWidth; x++) {
            ctx.fillStyle = starColors[Math.floor(Math.random() * starColors.length)];
            const y: number = Math.floor(Math.random() * window.innerHeight);
            const size: number = starSizes[Math.floor(Math.random() * starSizes.length)];
            ctx.fillRect(x, y, size, size);
        }
        requestRef.current = requestAnimationFrame(() => animate(ctx, fakeCtx));
        return (): void => {
            if (requestRef.current !== null) {
                cancelAnimationFrame(requestRef.current);
            }
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
        thumbnail = 'pack.png';
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
                <button>Play Selected World</button>
                <button>Create New World</button>
                <button>Edit</button>
                <button>Delete</button>
                <SwitchMenuButton menu='main'>Cancel</SwitchMenuButton>
            </WorldSelectionBottom>
        </MenuSection>
    );
}


function EscapeMenu(): ReactNode {
    const resume = useContext(MenuContext).resume;
    return (
        <MenuSection name='escape'>
            <button onClick={resume}>Back to Game</button>
            <SwitchMenuButton menu='main'>Save and Quit to Title</SwitchMenuButton>
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
                <div className='version'>v0.2.0</div>
            </div>
        </MenuSection>
    )
}

function Menu({worlds, enterWorld, resume, saveAndQuitToTitle, menu, setMenu}: {worlds: WorldInfo[], enterWorld: (world: WorldInfo) => void, resume, saveAndQuitToTitle, menu: string, setMenu: (menu: string) => void, showStars?: boolean}): ReactNode {
    const [showStars, setShowStars] = useState(true);
    const contextData = {
        menu: menu,
        setMenu: setMenu,
        enterWorld: enterWorld,
        resume: resume,
    };
    return (
        <div className='menu'>
            {showStars && <StarCanvas />}
            <MenuContext.Provider value={contextData}>
                <MainMenu />
                <SingleplayerMenu worlds={worlds} />
                <MultiplayerMenu />
                <EscapeMenu />
                <Settings />
            </MenuContext.Provider>
        </div>
    );
}

export {
    WorldInfo,
    Menu,
}
