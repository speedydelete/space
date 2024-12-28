
import type {ReactNode, RefObject} from 'react';
import React, {StrictMode, useRef, useState, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {type WorldInfo, Menu} from './menu.tsx';

function GameIframe({doEscape, setLoadingScreenMessage, closeLoadingScreen}: {doEscape: () => void, setLoadingScreenMessage: (value: string) => void, closeLoadingScreen: () => void}): ReactNode {
    let iframeRef: RefObject<null | HTMLIFrameElement> = useRef(null);
    function sendMessage(type: string): void {
        if (iframeRef.current !== null && iframeRef.current.contentWindow !== null) {
            iframeRef.current.contentWindow.postMessage({isSpace: true, type: type,}, window.origin);
        }
    }
    function handleMessage(event: MessageEvent): void {
        if (iframeRef.current && event.source === iframeRef.current.contentWindow && event.data.isSpace === true) {
            const {type, data} = event.data;
            if (type === 'escape') {
                doEscape();
            } else if (type === 'set-loading-screen-message') {
                setLoadingScreenMessage(data);
                sendMessage('loading-screen-message-set');
            } else if (type === 'close-loading-screen') {
                closeLoadingScreen();
            }
        }
    }
    useEffect(() => {
        setTimeout(() => {
            sendMessage('start');
            window.addEventListener('message', handleMessage);
        }, 100);
        return () => {
            sendMessage('stop');
            window.removeEventListener('message', handleMessage);
        };
    }, []);
    return <iframe src="client.html" ref={iframeRef}></iframe>;
}

function Game(): ReactNode {
    const [inMenu, setInMenu] = useState(true);
    const [menu, setMenu] = useState('main');
    const [visible, setVisible] = useState(false);
    const [showStars, setShowStars] = useState(true);
    const [loadingScreenMessage, setLoadingScreenMessage] = useState('Loading');
    let currentWorldRef: RefObject<null | WorldInfo> = useRef(null);
    return (
        <div>
            {inMenu && <Menu 
                enterWorld={(world: WorldInfo) => {
                    console.log(world);
                    currentWorldRef.current = world;
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
            {visible && <GameIframe
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
