
import type {ReactNode, RefObject} from 'react';
import React, {useRef, useState, useEffect, useContext, createContext} from 'react';
import {presets} from './presets.ts';
import {type Settings, type SettingsKey, type SettingsValue, loadSettings, saveSettings, type WorldInfo, loadWorlds, saveWorlds, defaultSettings} from './client.ts';
import {About} from './about.tsx';

const MenuContext = createContext<{
    menu: string;
    setMenu: (menu: string) => void;
    worlds: WorldInfo[];
    setWorlds: (worlds: WorldInfo[]) => void;
    enterWorld: (worldId: number) => void;
    resume: () => void;
    saveAndQuitToTitle: () => void;
    settingsBack: () => void;
    setSettingsBack: (settingsBack: () => void) => void;
    selectedWorld: number;
    setSelectedWorld: (world: number) => void;
}>({menu: '', setMenu: x => {}, worlds: [], setWorlds: x => {}, enterWorld: x => {}, resume: () => {}, saveAndQuitToTitle: () => {}, settingsBack: () => {}, setSettingsBack: x => {}, selectedWorld: 0, setSelectedWorld: x => {}});

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
    useEffect(() => {
        // @ts-ignore
        let ctx: CanvasRenderingContext2D = canvasRef.current.getContext('2d');
        // @ts-ignore
        let fakeCtx: CanvasRenderingContext2D = document.createElement('canvas').getContext('2d');
        setup(ctx, fakeCtx);
        requestRef.current = requestAnimationFrame(() => animate(ctx, fakeCtx));
        const setupResizeFunc = () => setup(ctx, fakeCtx);
        window.addEventListener('resize', setupResizeFunc);
        return () => {
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

function Centered({children, className}: {children: ReactNode, className?: string}): ReactNode {
    return <div className='centered'><div className={className}>{children}</div></div>;
}

function LeftCentered({children, className}: {children: ReactNode, className?: string}): ReactNode {
    return (
        <div className='left-centered-wrapper'>
            <div className='centering-space'></div>
            <div className={className}>{children}</div>
            <div className='centering-space'></div>
        </div>
    );
}

function UnavailableIfButton({children, cond, onClick}: {children: ReactNode, cond: boolean, onClick?: React.EventHandler<React.MouseEvent<HTMLButtonElement>>}): ReactNode {
    const eltRef: RefObject<HTMLButtonElement | null> = useRef(null);
    return <button ref={eltRef} className={cond ? '' : 'unavailable'} onClick={onClick}>{children}</button>;
}

function SwitchMenuButton({menu, children, cond}: {menu: string, children: ReactNode, cond?: boolean}): ReactNode {
    const setMenu = useContext(MenuContext).setMenu;
    if (cond === undefined) {
        return <button onClick={() => setMenu(menu)}>{children}</button>;
    } else {
        return <UnavailableIfButton onClick={() => setMenu(menu)} cond={cond}>{children}</UnavailableIfButton>
    }
}

function MenuSection({name, children}: {name: string, children: ReactNode}): ReactNode {
    const menu = useContext(MenuContext).menu;
    return menu === name && <div className={`submenu ${name}-menu`}>{children}</div>;
}

function MenuWorld({world, index}: {world: WorldInfo, index: number}): ReactNode {
    const {enterWorld, selectedWorld, setSelectedWorld} = useContext(MenuContext);
    let thumbnail = world.thumbnail;
    let style = {};
    if (thumbnail === undefined) {
        thumbnail = 'data/img/pack.png';
        style = {filter: 'grayscale(100%)'};
    }
    function handleClick(): void {
        if (selectedWorld === index) {
            setSelectedWorld(-1);
        } else {
            setSelectedWorld(index);
        }
    }
    let divRef: RefObject<HTMLDivElement | null> = useRef(null);
    useEffect(() => {
        if (divRef.current !== null) {
            if (selectedWorld === index) {
                divRef.current.classList.add('selected-menu-world');
            } else {
                divRef.current.classList.remove('selected-menu-world');
            }
        }
    }, [selectedWorld]);
    return (
        <div className='menu-world' onClick={handleClick} ref={divRef}>
            <div onClick={() => enterWorld(index)}>
                <img src={thumbnail} style={style} />
                <img className='enter-arrow' src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' preserveAspectRatio='none' viewBox='0 0 16 16'><polygon points='8,2 8,14 14,8' style='fill: white;' /></svg>" />
            </div>
            <div>
                <div>{world.name}</div>
                <div className='menu-world-desc'>{world.desc}</div>
            </div>
        </div>
    );
}

function WorldSelection({children}: {children: ReactNode}): ReactNode {
    return <LeftCentered className='menu-worlds'>{children}</LeftCentered>;
}

function WorldSelectionBottom({children}: {children: ReactNode}): ReactNode {
    return (
        <div className='menu-worlds-bottom-wrapper'>
            <Centered className='menu-worlds-bottom'>{children}</Centered>
        </div>
    );
}

function EditWorldMenu(): ReactNode {
    const {selectedWorld, worlds, setWorlds} = useContext(MenuContext);
    const [name, setName] = useState('');
    const [iconReset, setIconReset] = useState(false);
    useEffect(() => {
        if (selectedWorld !== -1) {
            const world = worlds[selectedWorld];
            setName(world.name);
        }
    }, [selectedWorld]);
    function save() {
        let world = worlds[selectedWorld];
        world.name = name;
        if (iconReset) world.thumbnail = undefined;
        setWorlds(worlds.slice(0, selectedWorld).concat(world, worlds.slice(selectedWorld)));
        saveWorlds(worlds);
    }
    return (
        <MenuSection name='edit-world'>
            <Centered className='thin-menu-content'>
                <h1>Edit World</h1>
                <div>World Name:&nbsp;<input type="text" value={name} /></div>
                <button onClick={() => setIconReset(true)}>Reset World Icon</button>
                <div className='bottom'>
                    <button onClick={save}>Save</button>
                    <SwitchMenuButton menu='singleplayer'>Cancel</SwitchMenuButton>
                </div>
            </Centered>
        </MenuSection>
    ); 
}

function CreateWorldMenu(): ReactNode {
    const {worlds, setWorlds, setMenu, enterWorld} = useContext(MenuContext);
    const [name, setName] = useState('New World');
    const [preset, setPreset] = useState('1');
    async function create() {
        const presetObj = presets[parseInt(preset)];
        const newWorlds = worlds.concat({
            name: name,
            desc: `Preset: ${presetObj.name}`,
            data: await presetObj.data,
        });
        setWorlds(newWorlds);
        saveWorlds(newWorlds);
        setMenu('singleplayer');
        enterWorld(newWorlds.length - 1);
    }
    return (
        <MenuSection name='create-world'>
            <Centered className='thin-menu-content'>
                <h1>Create New World</h1>
                <div>World Name:&nbsp;
                    <input type="text" defaultValue={name} onChange={(event) => setName(event.target.value)} />
                </div>
                <div>Preset:&nbsp;
                    <select value={preset} onChange={(event) => setPreset(event.target.value)}>
                        {presets.map((x, i) => <option value={String(i)} key={i}>{x.name}</option>)}
                    </select>
                </div>
                <div className='bottom'>
                    <button onClick={create}>Create</button>
                    <SwitchMenuButton menu='singleplayer'>Cancel</SwitchMenuButton>
                </div>
            </Centered>
        </MenuSection>
    );
}

function DeleteWorldMenu(): ReactNode {
    const {worlds, setWorlds, selectedWorld, setSelectedWorld, setMenu} = useContext(MenuContext);
    function deleteWorld() {
        const newWorlds = worlds.slice();
        newWorlds.splice(selectedWorld, 1);
        setWorlds(newWorlds);
        saveWorlds(newWorlds);
        setMenu('singleplayer');
        setSelectedWorld(-1);
    }
    return (
        <MenuSection name='delete-world'>
            <Centered className='thin-menu-content'>
                <h1>Delete World</h1>
                <div>Are you sure you want to delete the world "{worlds[selectedWorld] === undefined ? '<no world selected>' : worlds[selectedWorld].name}"? It will be deleted forever! There is no way to restore a deleted world.</div>
                <div className='bottom'><button onClick={deleteWorld}>Delete</button><SwitchMenuButton menu='singleplayer'>Cancel</SwitchMenuButton></div>
            </Centered>
        </MenuSection>
    );
}

function SingleplayerMenu(): ReactNode {
    const {worlds, enterWorld, selectedWorld} = useContext(MenuContext);
    return (
        <MenuSection name='singleplayer'>
            <WorldSelection>{worlds.map((world, i) => <MenuWorld world={world} key={i} index={i} />)}</WorldSelection>
            <WorldSelectionBottom>
                <div>
                    <UnavailableIfButton cond={selectedWorld !== -1} onClick={() => enterWorld(selectedWorld)}>Play Selected World</UnavailableIfButton>
                    <SwitchMenuButton menu='create-world'>Create New World</SwitchMenuButton>
                </div>
                <div>
                    <SwitchMenuButton menu='edit-world' cond={selectedWorld !== -1}>Edit</SwitchMenuButton>
                    <SwitchMenuButton menu='delete-world' cond={selectedWorld !== -1}>Delete</SwitchMenuButton>
                    <SwitchMenuButton menu='main'>Cancel</SwitchMenuButton>
                </div>
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

const SettingsContext: React.Context<[Settings, React.Dispatch<React.SetStateAction<Settings>>]> = createContext<[Settings, React.Dispatch<React.SetStateAction<Settings>>]>([defaultSettings, () => null]);

function Setting({type, setting, name}: {type: string, setting: SettingsKey, name: string}): ReactNode {
    const [settings, setSettings] = useContext(SettingsContext);
    const [value, setValue] = useState(settings[setting]);
    function handleChange(event: React.FormEvent<HTMLInputElement>) {
        const target = event.currentTarget;
        let newValue: SettingsValue;
        // if (target.type === 'checkbox') {
        //     newValue = target.checked;
        // } else if (target.type === 'number') {
            newValue = target.valueAsNumber;
            if (Number.isNaN(newValue)) {
                // @ts-ignore
                setValue(target.value);
                return;
            }
        // } else {
        //    newValue = target.value;
        // }
        setValue(newValue);
        settings[setting] = newValue;
        setSettings(settings);
        saveSettings(settings);
        localStorage.setItem('space-game-settings', JSON.stringify(settings));
    }
    return (
        <div>
            <label htmlFor={setting}>{name}:&nbsp;</label>
            <input
                type={type}
                onChange={handleChange}
                value={typeof value === 'number' || typeof value === 'string' ? value : ''}
                checked={typeof value === 'boolean' ? value : undefined}
                name={setting}
            />
        </div>
    );
}

function SettingsMenu(): ReactNode {
    const [settings, setSettings] = useState(loadSettings());
    const {settingsBack} = useContext(MenuContext);
    return (
        <MenuSection name='settings'>
            <div className='lower-left'><button onClick={settingsBack}>Back</button></div>
            <LeftCentered className='scroll settings'>
                <h1>Settings</h1>
                <SettingsContext.Provider value={[settings, setSettings]}>
                    <Setting type='number' setting='fov' name='FOV' />
                    <Setting type='number' setting='unitSize' name='Unit Size' />
                    <Setting type='number' setting='renderDistance' name='Render Distance' />
                    <Setting type='number' setting='cameraMinDistance' name='Camera Minimum Distance' />
                    <Setting type='number' setting='cameraMaxDistance' name='Camera Maximum Distance' />
                    <Setting type='number' setting='controlsMinDistance' name='Zoom Minimum Distance' />
                    <Setting type='number' setting='controlsMaxDistance' name='Zoom Maximum Distance' />
                </SettingsContext.Provider>
            </LeftCentered>
        </MenuSection>
    );
}

function AboutMenu(): ReactNode {
    return (
        <MenuSection name='about'>
            <div className='lower-left'><SwitchMenuButton menu='main'>Back</SwitchMenuButton></div>
            <LeftCentered className='scroll about-content'><About /></LeftCentered>
        </MenuSection>
    );
}

function InnerEscapeMenu(): ReactNode {
    const {resume, saveAndQuitToTitle, setSettingsBack, setMenu} = useContext(MenuContext);
    useEffect(() => {
        setSettingsBack(() => resume);
        return () => {
           setSettingsBack(() => () => setMenu('main'));
        }
    });
    return (
        <>
            <button onClick={resume}>Back to Game</button>
            <SwitchMenuButton menu='settings'>Options</SwitchMenuButton>
            <button onClick={saveAndQuitToTitle}>Save and Quit to Title</button>
        </>
    );
}

function EscapeMenu(): ReactNode {
    return <MenuSection name='escape'><InnerEscapeMenu /></MenuSection>
}

function LoadingScreenMenu({message}: {message: string}): ReactNode {
    return <MenuSection name='loading'>{message}</MenuSection>;
}

function MainMenu(): ReactNode {
    return (
        <MenuSection name='main'>
            <div className='title'>Space</div>
            <SwitchMenuButton menu='singleplayer'>Singleplayer</SwitchMenuButton>
            <SwitchMenuButton menu='multiplayer'>Multiplayer</SwitchMenuButton>
            <SwitchMenuButton menu='settings'>Settings</SwitchMenuButton>
            <SwitchMenuButton menu='about'>About</SwitchMenuButton>
            <div className='small-text lower-left'>v0.4.0</div>
        </MenuSection>
    )
}

function Menu({enterWorld, resume, saveAndQuitToTitle, menu, setMenu, showStars, loadingScreenMessage}: {enterWorld: (worldId: number) => void, resume: () => void, saveAndQuitToTitle: () => void, menu: string, setMenu: (menu: string) => void, showStars: boolean, loadingScreenMessage: string}): ReactNode {
    const [settingsBack, setSettingsBack] = useState(() => () => setMenu('main'));
    const [selectedWorld, setSelectedWorld] = useState(-1);
    const storageWorlds = localStorage.getItem('space-game-worlds');
    const [worlds, setWorlds] = useState(storageWorlds !== null ? JSON.parse(storageWorlds) : []);
    const contextData = {menu, setMenu, worlds, setWorlds, enterWorld, resume, saveAndQuitToTitle, settingsBack, setSettingsBack, selectedWorld, setSelectedWorld};
    return (
        <div className='wrapper'>
            {showStars && <StarCanvas />}
            <MenuContext.Provider value={contextData}>
                <MainMenu />
                <SingleplayerMenu />
                <EditWorldMenu />
                <CreateWorldMenu />
                <DeleteWorldMenu />
                <MultiplayerMenu />
                <SettingsMenu />
                <AboutMenu />
                <EscapeMenu />
                <LoadingScreenMenu message={loadingScreenMessage} />
            </MenuContext.Provider>
        </div>
    );
}

export {
    WorldInfo,
    Menu,
}
