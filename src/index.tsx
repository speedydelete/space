
import type {ReactNode, RefObject} from 'react';
import React, {StrictMode, useRef, useState, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {type WorldInfo, Menu} from './menu.tsx';
import {World} from './world.ts';
import {Server} from './server.ts';
import {Client, loadWorlds} from './client.ts';

function ReactClient({currentWorldIdRef, doEscape, setLoadingScreenMessage, closeLoadingScreen}: {currentWorldIdRef: RefObject<number>, doEscape: () => void, setLoadingScreenMessage: (value: string) => void, closeLoadingScreen: () => void}): ReactNode {
    const divRef: RefObject<HTMLDivElement | null> = useRef(null);
    const serverRef: RefObject<Server | null> = useRef(null);
    const clientRef: RefObject<Client | null> = useRef(null);
    useEffect(() => {
        (async () => {
            const server = new Server(await World.import(loadWorlds()[currentWorldIdRef.current].data));
            const client = new Client(
                server.recv.bind(server),
                server.clientRecv.bind(server),
                currentWorldIdRef.current,
                doEscape,
                closeLoadingScreen,
                setLoadingScreenMessage,
            );
            serverRef.current = server;
            clientRef.current = client;
            document.body.appendChild(client.renderer.domElement);
            server.init();
            server.start();
            client.start();
        })();
        return () => {
            const server = serverRef.current;
            const client = clientRef.current;
            server?.stop();
            client?.stop();
        };
    }, []);
    return <div ref={divRef}></div>;
}

function Game(): ReactNode {
    const [inMenu, setInMenu] = useState(true);
    const [menu, setMenu] = useState('main');
    const [visible, setVisible] = useState(false);
    const [showStars, setShowStars] = useState(true);
    const [loadingScreenMessage, setLoadingScreenMessage] = useState('Loading');
    let currentWorldRef: RefObject<null | WorldInfo> = useRef(null);
    let currentWorldIdRef: RefObject<number> = useRef(-1);
    return (
        <div>
            {inMenu && <Menu 
                enterWorld={(worldId: number) => {
                    const storageWorlds = localStorage.getItem('space-game-worlds');
                    if (storageWorlds === null) return;
                    currentWorldRef.current = JSON.parse(storageWorlds)[worldId];
                    currentWorldIdRef.current = worldId;
                    setMenu('loading');
                    setVisible(true);
                }}
                resume={() => {
                    setInMenu(false);
                    setVisible(true);
                }}
                saveAndQuitToTitle={() => {
                    setVisible(false);
                    setInMenu(true);
                    setMenu('main');
                    setShowStars(true);
                }}
                menu={menu}
                setMenu={setMenu}
                showStars={showStars}
                loadingScreenMessage={loadingScreenMessage}
            />}
            {visible && <ReactClient
                currentWorldIdRef={currentWorldIdRef}
                doEscape={() => {
                    setInMenu(true);
                    setVisible(true);
                    setMenu('escape');
                    setShowStars(false);
                }}
                setLoadingScreenMessage={setLoadingScreenMessage}
                closeLoadingScreen={() => {
                    setInMenu(false);
                    setShowStars(false);
                }}
            />}
        </div>
    );
}

const rootElement = document.getElementById('root');
if (rootElement === null) throw new TypeError('cannot initiate react due to nonexistent root element');
const root = createRoot(rootElement);
root.render(
    <StrictMode>
        <Game />
    </StrictMode>
);
