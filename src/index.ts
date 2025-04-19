
import {getPresetIndex, loadPreset} from './preset_loader';


(async () => {
    let preset = (await getPresetIndex()).find(x => x.default);
    if (!preset) {
        throw new Error('No default preset');
    }
    let world = loadPreset(preset);
});
