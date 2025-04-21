
import {Obj} from './obj';
import {World} from './world';


export interface Preset {
    name: string;
    path: string;
    default?: boolean;
    description?: string;
    author?: string;
    icon?: string;
}

export async function getPresetIndex(): Promise<Preset[]> {
    let resp = await fetch('data/presets/index.json');
    if (resp.ok) {
        return await resp.json();
    } else {
        throw new Error(`HTTP error while fetching preset index: ${resp.status} ${resp.statusText}`);
    }
}


function addDotKey(obj: {[key: string]: any}, key: string, value: any): void {
    let index = key.indexOf('.');
    if (index === -1) {
        obj[key] = value;
    } else {
        let start = key.slice(0, index);
        if (!(start in obj)) {
            if (value === undefined) {
                return;
            }
            obj[start] = {};
        }
        addDotKey(obj[start], key.slice(index + 1), value);
    }
}

function parseCSV(data: string): {[key: string]: {[key: string]: any}} {
    let rows: string[][] = [];
    let buffer = '';
    let row: string[] = [];
    let inString = false;
    let wasBackslash = false;
    for (let char of data) {
        if (wasBackslash) {
            buffer += char;
            wasBackslash = false;    
        } else if (char === '\\') {
            wasBackslash = true;
        } else if (char === '"') {
            inString = !inString;
        } else if (inString) {
            buffer += char;
        } else if (char === ',') {
            row.push(buffer);
            buffer = '';
        } else if (char === '\n') {
            row.push(buffer);
            buffer = '';
            rows.push(row);
            row = [];
        } else {
            buffer += char;
        }
    }
    row.push(buffer);
    rows.push(row);
    let out: {[key: string]: {[key: string]: any}} = {};
    let headers = rows[0];
    for (let row of rows.slice(1)) {
        let obj: {[key: string]: any} = {};
        for (let i = 1; i < row.length; i++) {
            let value: any = row[i];
            if (value === '') {
                value = undefined;
            } else {
                try {
                    value = JSON.parse(value);
                } catch (error) {
                    if (error instanceof SyntaxError) {
                        if (value.match(/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d(.\d+)?Z$/)) {
                            value = new Date(value);
                        }
                    } else {
                        throw error;
                    }
                }
            }
            addDotKey(obj, headers[i], value);
        }
        out[row[0]] = obj;
    }
    return out;
}


export async function loadPreset(preset: Preset): Promise<World> {
    let resp = await fetch('data/presets/' + preset.path);
    if (resp.ok) {
        let data = parseCSV(await resp.text()) as {[key: string]: Obj};
        let out = new World();
        for (let [name, obj] of Object.entries(data)) {
            out.setObj(name, obj);
        }
        return out;
    } else {
        throw new Error(`HTTP error while fetching preset '${preset.name}': ${resp.status} ${resp.statusText}`);
    }
}
