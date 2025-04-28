
export interface Settings {
    fov: number,
    renderDistance: number,
    unitSize: number,
    cameraMinDistance: number,
    cameraMaxDistance: number,
    controlsMinDistance: number,
    controlsMaxDistance: number,
    backgroundStars: boolean,
    menuBackgroundStars: boolean,
    keplerTolerance: number,
}

export const DEFAULT_SETTINGS: Settings = {
    fov: 70,
    renderDistance: 150000000000,
    unitSize: 1000000,
    cameraMinDistance: 0.0000001,
    cameraMaxDistance: 1000000000000,
    controlsMinDistance: 0.00001,
    controlsMaxDistance: Number.MAX_SAFE_INTEGER,
    backgroundStars: true,
    menuBackgroundStars: true,
    keplerTolerance: 1e-6,
}

export let settings: Settings;

if ('space-settings' in localStorage) {
    settings = JSON.parse(localStorage['space-settings']);
    for (let key in DEFAULT_SETTINGS) {
        if (!(key in settings)) {
            // @ts-ignore
            settings[key] = DEFAULT_SETTINGS[key];
        }
    }
} else {
    settings = DEFAULT_SETTINGS;
}

export default settings;

export function setSettingsKey<T extends keyof Settings>(key: T, value: Settings[T]): void {
    settings[key] = value;
    localStorage['space-settings'] = JSON.stringify(settings);
}
