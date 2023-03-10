export function setAlpha(hex: any, alpha: any): string;
export function getColorFromFraction(sourceColor: any, destinationColor: any, range: any, fraction: any, returnRawData: any): any[] | rgbaColor;
export function Section(start: any, stop: any, color: any): {
    start: any;
    stop: any;
    color: any;
};
export function calcNiceNumber(range: any, round: any): number;
export function roundedRectangle(ctx: any, x: any, y: any, w: any, h: any, radius: any): void;
export function createAudioElement(audioSrc: any): HTMLAudioElement | null;
export function createBuffer(width: any, height: any): HTMLCanvasElement;
export function drawToBuffer(width: any, height: any, drawFunction: any): HTMLCanvasElement;
export function getColorValues(color: any): number[];
export function customColorDef(color: any): any;
export function rgbToHsl(red: any, green: any, blue: any): (number | undefined)[];
export function hsbToRgb(hue: any, saturation: any, brightness: any): number[];
export function rgbToHsb(r: any, g: any, b: any): (number | undefined)[];
export function range(value: any, limit: any): any;
export function setInRange(value: any, min: any, max: any): any;
export function darker(color: any, fraction: any): rgbaColor;
export function lighter(color: any, fraction: any): rgbaColor;
export function wrap(value: any, lower: any, upper: any): number;
export function getShortestAngle(from: any, to: any): number;
export function getCanvasContext(elementOrId: any): any;
export function coalesce(prop: any, _default?: undefined): any;
export function isHexColor(color: any): boolean;
export class rgbaColor {
    constructor(r: any, g: any, b: any, a: any, ...args: any[]);
    getRed: () => any;
    setRed: (r: any) => void;
    getGreen: () => any;
    setGreen: (g: any) => void;
    getBlue: () => any;
    setBlue: (b: any) => void;
    getAlpha: () => any;
    setAlpha: (a: any) => void;
    getRgbaColor: () => string;
    getRgbColor: () => string;
    getHexColor: () => string;
}
export class ConicalGradient {
    constructor(fractions: any, colors: any);
    fillCircle: (ctx: any, centerX: any, centerY: any, innerX: any, outerX: any) => void;
    fillRect: (ctx: any, centerX: any, centerY: any, width: any, height: any, thicknessX: any, thicknessY: any) => void;
}
export class gradientWrapper {
    constructor(start: any, end: any, fractions: any, colors: any);
    getColorAt: (fraction: any) => any;
    getStart: () => any;
    getEnd: () => any;
    getRange: () => number;
}
export const requestAnimFrame: ((callback: FrameRequestCallback) => number) & typeof requestAnimationFrame;
//# sourceMappingURL=common.d.ts.map