
export function query<T extends HTMLElement>(query: string): T;
export function query<T extends HTMLElement>(query: string, all: true): NodeListOf<T>;
export function query<T extends HTMLElement>(query: string, all?: true): T | NodeListOf<T> {
    if (all) {
        return document.querySelectorAll(query) as NodeListOf<T>;
    } else {
        let out = document.querySelector(query);
        if (!out) {
            throw new Error(`Missing query: ${query}`);
        }
        return out as T;
    }
}


export const {floor, ceil, abs, sqrt, PI: pi} = Math;
export const sin = (x: number) => Math.sin(x * pi / 180);
export const cos = (x: number) => Math.cos(x * pi / 180);
export const tan = (x: number) => Math.tan(x * pi / 180);
export const asin = (x: number) => Math.asin(x) * 180 / pi;
export const acos = (x: number) => Math.acos(x) * 180 / pi;
export const atan2 = (x: number, y: number) => Math.atan2(x, y) * 180 / pi;


export function stringInput(eltQuery: string, value: string, callback: (value: string, elt: HTMLInputElement) => void): void {
    let elt = query<HTMLInputElement>(eltQuery);
    elt.value = value;
    elt.addEventListener('input', () => callback(elt.value, elt));
}

export function numberInput(eltQuery: string, value: number, callback: (value: number, elt: HTMLInputElement) => void): void {
    stringInput(eltQuery, String(value), (_, elt) => {
        let value = parseFloat(elt.value);
        if (isNaN(value)) {
            elt.classList.add('invalid');
        } else {
            callback(value === 0 ? parseInt(elt.value) : value, elt);
            elt.classList.remove('invalid');
        }
    });
}
