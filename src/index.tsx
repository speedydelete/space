
import type {ReactNode, RefObject} from 'react';
import React, {useRef, useState, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {Menu} from './menu.tsx';
import {World} from './world.ts';
import {Server} from './server.ts';
import {Client, loadWorlds} from './client.ts';

const rootElement = document.getElementById('root');
if (rootElement === null) throw new TypeError('cannot initiate react due to nonexistent root element');

function ReactClient({currentWorldIdRef, doEscape, setLoadingScreenMessage, closeLoadingScreen}: {currentWorldIdRef: RefObject<number>, doEscape: () => void, setLoadingScreenMessage: (value: string) => void, closeLoadingScreen: () => void}): ReactNode {
    const divRef: RefObject<HTMLDivElement | null> = useRef(null);
    const serverRef: RefObject<Server | null> = useRef(null);
    const clientRef: RefObject<Client | null> = useRef(null);
    const startGamePromiseRef: RefObject<Promise<void>> = useRef(Promise.resolve(undefined));
    useEffect(() => {
        startGamePromiseRef.current = (async () => {
            const server = new Server(await World.import(loadWorlds()[currentWorldIdRef.current].data));
            const client = new Client(
                server.recv.bind(server),
                server.clientRecv.bind(server),
                currentWorldIdRef.current,
                doEscape,
                closeLoadingScreen,
                async function(message: string): Promise<void> {
                    console.log(message);
                    setLoadingScreenMessage(message);
                }
            );
            serverRef.current = server;
            clientRef.current = client;
            divRef.current?.appendChild(client.renderer.domElement);
            server.init();
            server.start();
            client.start();
        })();
        return () => {
            startGamePromiseRef.current.then(() => {
                const server = serverRef.current;
                const client = clientRef.current;
                server?.stop();
                client?.stop();
                if (client !== null) divRef.current?.removeChild(client.renderer.domElement);
                serverRef.current = null;
                clientRef.current = null;
            })
        };
    }, []);
    return (
        <div ref={divRef}>
            <div id='left-info'></div>
            <div id='right-info'></div>
        </div>
    );
}

function Game(): ReactNode {
    const [inMenu, setInMenu] = useState(true);
    const [menu, setMenu] = useState('main');
    const [visible, setVisible] = useState(false);
    const [showStars, setShowStars] = useState(true);
    const [loadingScreenMessage, setLoadingScreenMessage] = useState('Loading');
    let currentWorldIdRef: RefObject<number> = useRef(-1);
    return (
        <div>
            {inMenu && <Menu 
                enterWorld={(worldId: number) => {
                    const storageWorlds = localStorage.getItem('space-game-worlds');
                    if (storageWorlds === null) return;
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

const root = createRoot(rootElement);
root.render(<Game />);
