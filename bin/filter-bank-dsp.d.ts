import { Preset } from "./filter-bank-preset.js";
export declare const dbToGain: (db: number) => number;
export declare const gainToDb: (gain: number) => number;
export declare class FilterBankDSP {
    private readonly terminator;
    private readonly inputGain;
    private readonly outputGain;
    private readonly highPass;
    private readonly lowShelf;
    private readonly peaking;
    private readonly highShelf;
    private readonly lowPass;
    readonly filters: BiquadFilterNode[][];
    constructor(context: AudioContext);
    applyPreset(preset: Preset): void;
}
