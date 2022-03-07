import { Random } from "./math.js";
export declare class Colors {
    static hslToRgb(h?: number, s?: number, l?: number): number;
    static getRandomPalette(random: Random): number[];
    static getPaletteByIndex(index: number): number[];
    private static PALETTES;
}
