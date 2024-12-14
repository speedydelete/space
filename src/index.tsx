
import type {ReactNode, RefObject} from 'react';
import React, {StrictMode, useRef, useState, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {Client} from './client';
import {type WorldInfo, Menu} from './menu';

function Game(): ReactNode {
    const worlds = [
        {
            name: 'New World',
            desc: '2024-12-13 00:00:00\nCreative Mode, v0.2.0',
        },
    ];
    const [inMenu, setInMenu] = useState(true);
    const [menu, setMenu] = useState('main');
    const [visible, setVisible] = useState(false);
    let currentWorld: RefObject<null | WorldInfo> = useRef(null);
    let client = new Client();
    function escapeHandler(event: KeyboardEvent): void {
        if (event.key == 'Escape') {
            client.stop();
            setInMenu(true);
            setMenu('escape');
        }
    }
    function resume(): void {
        setInMenu(false);
        window.addEventListener('keydown', escapeHandler);
        client.start();
        setVisible(true);
    }
    function saveAndQuitToTitle(): void {
        setVisible(false);
        setInMenu(true);
        setMenu('main');
    }
    function enterWorld(world: WorldInfo): void {
        currentWorld.current = world;
        client = new Client();
        resume();
    }
    useEffect(() => {
        if (visible) {
            document.body.appendChild(client.renderer.domElement);
            return () => {
                document.body.removeChild(client.renderer.domElement);
            }
        }
    }, [visible]);
    return (
        inMenu && <Menu 
            worlds={worlds}
            enterWorld={enterWorld}
            resume={resume}
            saveAndQuitToTitle={saveAndQuitToTitle}
            menu={menu}
            setMenu={setMenu}
        />
    );
}

// const client = new Client();
// document.body.appendChild(client.renderer.domElement);
// client.start();

const rootElement = document.getElementById('root');
if (rootElement === null) throw new TypeError('cannot initiate react due to nonexistent root element');
const root = createRoot(rootElement);
root.render(
    <StrictMode>
        <Game />
    </StrictMode>
);
