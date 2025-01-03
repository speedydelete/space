
import React, {type ReactNode} from 'react';

function About(): ReactNode {
    return (
        <>
            <h1>About</h1>
            Space is an open-source space simulation game licensed under the <a href='https://www.gnu.org/licenses/gpl-3.0.en.html#license-text'>GPLv3.0</a>. Here is its <a href='https://github.com/speedydelete/space'>GitHub</a>.
            <br />
            <br />
            <h2>Version History</h2>
            <ul>
                <li>v0.4.0 - 2024-12-30
                    <ul>
                        <li>Made the world selection menu functional.</li>
                        <li>Added a settings menu.</li>
                        <li>Added a loading screen.</li>
                    </ul>
                </li>
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
                    These textures are from <a href='https://solarsystemscope.com/'>solarsystemscope.com</a>. They were created by <a href='http://inove.eu.com/'>INOVE</a> and are licensed under the <a href='https://creativecommons.org/licenses/by/4.0/'>Creative Commons Attribution 4.0 International License.</a>
                    <ul>
                        <li><a href='data/textures/ssc/sun.jpg'>sun.jpg</a></li>
                        <li><a href='data/textures/ssc/sun_8k.jpg'>sun_8k.jpg</a></li>
                        <li><a href='data/textures/ssc/mercury.jpg'>mercury.jpg</a></li>
                        <li><a href='data/textures/ssc/mercury_8k.jpg'>mercury_8k.jpg</a></li>
                        <li><a href='data/textures/ssc/venus_atmosphere.jpg'>venus_atmosphere.jpg</a></li>
                        <li><a href='data/textures/ssc/venus_atmosphere_4k.jpg'>venus_atmosphere_4k.jpg</a></li>
                        <li><a href='data/textures/ssc/earth.jpg'>earth.jpg</a></li>
                        <li><a href='data/textures/ssc/earth_8k.jpg'>earth_8k.jpg</a></li>
                        <li><a href='data/textures/ssc/moon.jpg'>moon.jpg</a></li>
                        <li><a href='data/textures/ssc/moon_8k.jpg'>moon_8k.jpg</a></li>
                        <li><a href='data/textures/ssc/mars.jpg'>mars.jpg</a></li>
                        <li><a href='data/textures/ssc/mars_8k.jpg'>mars_8k.jpg</a></li>
                        <li><a href='data/textures/ssc/jupiter.jpg'>jupiter.jpg</a></li>
                        <li><a href='data/textures/ssc/jupiter_8k.jpg'>jupiter_8k.jpg</a></li>
                        <li><a href='data/textures/ssc/saturn.jpg'>saturn.jpg</a></li>
                        <li><a href='data/textures/ssc/saturn_8k.jpg'>saturn_8k.jpg</a></li>
                        <li><a href='data/textures/ssc/uranus.jpg'>uranus.jpg</a></li>
                        <li><a href='data/textures/ssc/neptune.jpg'>neptune.jpg</a></li>
                    </ul>
                </li>
                <li>
                    These textures are from <a href='https://github.com/nasa/NASA-3D-Resources/'>NASA</a> and are provided without copyright.
                    <ul>
                        <li><a href='data/textures/nasa/phobos.jpg'>phobos.jpg</a></li>
                        <li><a href='data/textures/nasa/deimos.jpg'>deimos.jpg</a></li>
                        <li><a href='data/textures/nasa/io.jpg'>io.jpg</a></li>
                        <li><a href='data/textures/nasa/europa.jpg'>europa.jpg</a></li>
                        <li><a href='data/textures/nasa/ganymede.jpg'>ganymede.jpg</a></li>
                        <li><a href='data/textures/nasa/callisto.jpg'>callisto.jpg</a></li>
                        <li><a href='data/textures/nasa/mimas.jpg'>mimas.jpg</a></li>
                        <li><a href='data/textures/nasa/enceladus.jpg'>enceladus.jpg</a></li>
                        <li><a href='data/textures/nasa/tethys.jpg'>tethys.jpg</a></li>
                        <li><a href='data/textures/nasa/dione.jpg'>dione.jpg</a></li>
                        <li><a href='data/textures/nasa/rhea.jpg'>rhea.jpg</a></li>
                        <li><a href='data/textures/nasa/titan.jpg'>titan.jpg</a></li>
                        <li><a href='data/textures/nasa/iapetus.jpg'>iapetus.jpg</a></li>
                        <li><a href='data/textures/nasa/ariel.jpg'>ariel.jpg</a></li>
                        <li><a href='data/textures/nasa/umbriel.jpg'>umbriel.jpg</a></li>
                        <li><a href='data/textures/nasa/titania.jpg'>titania.jpg</a></li>
                        <li><a href='data/textures/nasa/oberon.jpg'>oberon.jpg</a></li>
                        <li><a href='data/textures/nasa/miranda.jpg'>miranda.jpg</a></li>
                        <li><a href='data/textures/nasa/triton.jpg'>triton.jpg</a></li>
                        <li><a href='data/textures/nasa/pluto.jpg'>pluto.jpg</a></li>
                        <li><a href='data/textures/nasa/charon.jpg'>charon.jpg</a></li>
                    </ul>
                </li>
            </ul>
        </>
    );
}

export {
    About,
}
