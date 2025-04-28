
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

export function normalizeAngle(angle: number): number {
    angle %= 360;
    while (angle < 0) {
        angle += 360;
    }
    return angle;
}


export interface Vector3Like {
    x: number;
    y: number;
    z: number;
}

export class Vector3 implements Vector3Like {

    x: number;
    y: number;
    z: number;
    [index: number]: number;

    constructor(x?: number, y?: number, z?: number);
    constructor(vector: [number, number, number]);
    constructor(vector: Vector3Like);
    constructor(x: number | [number, number, number] | Vector3Like = 0, y: number = 0, z: number = 0) {
        if (typeof x === 'number') {
            this.x = x;
            this.y = y;
            this.z = z;
        } else if ('x' in x) {
            this.x = x.x;
            this.y = x.y;
            this.z = x.z;
        } else {
            this.x = x[0];
            this.y = x[1];
            this.z = x[2];
        }
        this[0] = this.x;
        this[1] = this.y;
        this[2] = this.z;
    }

    add(other: Vector3Like): Vector3 {
        return new Vector3(this.x + other.x, this.y + other.y, this.z + other.z);
    }

    sub(other: Vector3Like): Vector3 {
        return new Vector3(this.x - other.x, this.y - other.y, this.z - other.z);
    }

    mul(other: number | Matrix3): Vector3 {
        if (typeof other === 'number') {
            return new Vector3(this.x * other, this.y * other, this.z * other);
        } else {
            let {x, y, z} = this;
            let {data: d} = other;
            return new Vector3(
                x * d[0][0] + y * d[0][1] + z * d[0][2],
                x * d[1][0] + y * d[1][1] + z * d[1][2],
                x * d[2][0] + y * d[2][1] + z * d[2][2],
            );
        }
    }

    cross(other: Vector3Like): Vector3 {
        return new Vector3(
            this.y * other.z - this.z * other.y,
            this.z * other.x - this.x * other.z,
            this.x * other.y - this.y * other.x,
        );
    }

    dot(other: Vector3Like): number {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }

    div(other: number): Vector3 {
        return new Vector3(this.x / other, this.y / other, this.z / other);
    }

    abs(): number {
        return sqrt(this.x**2 + this.y**2 + this.z**2);
    }

    apply(func: (x: number) => number): Vector3 {
        return new Vector3(func(this.x), func(this.y), func(this.z));
    }

    normalizeAngles(): Vector3 {
        return this.apply(normalizeAngle);
    }

    toString(): string {
        return `Vector3(${this.x}, ${this.y}, ${this.z})`;
    }

}


export type Matrix3Data = [
    [number, number, number],
    [number, number, number],
    [number, number, number],
];

export class Matrix3 {

    data: Matrix3Data;

    constructor(data: Matrix3Data = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]) {
        this.data = data;
    }

}


export type InputCallback<T> = (value: T, elt: HTMLInputElement) => void;

export interface Input<T> {
    elt: HTMLInputElement;
    set(newValue: T): void;
}


export class StringInput implements Input<string> {

    elt: HTMLInputElement;

    constructor(eltQuery: string, callback: InputCallback<string>, value?: string) {
        this.elt = query(eltQuery);
        this.elt.value = String(value ?? '');
        this.elt.oninput = () => callback(this.elt.value, this.elt);
    }

    set(newValue?: string): void {
        this.elt.value = newValue ?? '';
    }

}


export class NumberInput implements Input<number> {

    elt: HTMLInputElement;

    constructor(eltQuery: string, callback: InputCallback<number>, value?: number) {
        this.elt = query(eltQuery);
        this.elt.value = String(value ?? '');
        this.elt.oninput = () => {
            let value = parseFloat(this.elt.value);
            if (isNaN(value)) {
                this.elt.classList.add('invalid');
            } else {
                callback(value === 0 ? parseInt(this.elt.value) : value, this.elt);
                this.elt.classList.remove('invalid');
            }
            callback(value, this.elt)
        };
    }

    set(newValue?: number) {
        this.elt.value = String(newValue ?? '');
    }

}


export class CheckboxInput implements Input<boolean> {

    elt: HTMLInputElement;

    constructor(eltQuery: string, callback: InputCallback<boolean>, value?: boolean) {
        this.elt = query(eltQuery);
        this.elt.checked = value ?? false;
        this.elt.oninput = () => callback(this.elt.checked, this.elt);
    }

    set(newValue?: boolean) {
        this.elt.checked = newValue ?? false;
    }

}
