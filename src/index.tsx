
import type {ReactNode, RefObject} from 'react';
import React, {StrictMode, useRef, useState, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {Client} from './client';
import {type WorldInfo, Menu} from './menu';

function ClientIframe({doEscape}: {doEscape: () => void}): ReactNode {
    let iframeRef: RefObject<null | HTMLIFrameElement> = useRef(null);
    function sendMessage(type: string): void {
        if (iframeRef.current !== null && iframeRef.current.contentWindow !== null) {
            iframeRef.current.contentWindow.postMessage({isSpace: true, type: type}, origin);
        }
    }
    function handleMessage(event: MessageEvent): void {
        if (iframeRef.current && event.source === iframeRef.current.contentWindow && event.data.isSpace === true) {
            const {type} = event.data;
            if (type == 'escape') {
                doEscape();
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
    const worlds = [
        {
            name: 'New World',
            desc: '2024-12-13 00:00:00\nCreative Mode, v0.2.0',
        },
    ];
    const [inMenu, setInMenu] = useState(true);
    const [menu, setMenu] = useState('main');
    const [visible, setVisible] = useState(false);
    const [showStars, setShowStars] = useState(true);
    let currentWorldRef: RefObject<null | WorldInfo> = useRef(null);
    function resume(): void {
        setInMenu(false);
        setShowStars(false);
        setVisible(true);
    }
    function saveAndQuitToTitle(): void {
        setVisible(false);
        setInMenu(true);
        setMenu('main');
        setShowStars(true);
    }
    function enterWorld(world: WorldInfo): void {
        currentWorldRef.current = world;
        resume();
    }
    function doEscape(): void {
        setInMenu(true);
        setVisible(true);
        setMenu('escape');
        setShowStars(false);
    }
    return (
        <div>
            {inMenu && <Menu 
                worlds={worlds}
                enterWorld={enterWorld}
                resume={resume}
                saveAndQuitToTitle={saveAndQuitToTitle}
                menu={menu}
                setMenu={setMenu}
                showStars={showStars}
            />}
            {visible && <ClientIframe doEscape={doEscape} />}
        </div>
    );
}

if (window.location.href.includes('client.html')) {
    const client = new Client();
    document.body.appendChild(client.renderer.domElement);
    client.start();
} else {
    const rootElement = document.getElementById('root');
    if (rootElement === null) throw new TypeError('cannot initiate react due to nonexistent root element');
    const root = createRoot(rootElement);
    root.render(
        <StrictMode>
            <Game />
        </StrictMode>
    );
}
