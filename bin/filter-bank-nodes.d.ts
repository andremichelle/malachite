import { Observable, Observer, Terminable } from "./lib/common.js";
import { Preset } from "./filter-bank-preset.js";
export declare const dbToGain: (db: number) => number;
export declare const gainToDb: (gain: number) => number;
export declare const DEFAULT_INTERPOLATION_TIME: number;
export declare const interpolateIfNecessary: (context: BaseAudioContext, audioParam: AudioParam, value: number) => void;
export interface FilterNode extends Terminable {
    enabled(): boolean;
    frequency(): number;
    apexDecibel(): number;
    connect(input: AudioNode): AudioNode;
    getFrequencyResponse(frequencyHz: Float32Array, magResponse: Float32Array, phaseResponse: Float32Array): void;
}
export declare class FilterBankNodes implements Observable<FilterBankNodes> {
    readonly context: AudioContext;
    private readonly terminator;
    private readonly observable;
    private readonly inputGain;
    private readonly outputGain;
    private readonly filters;
    private readonly highPassFilter;
    private readonly lowShelfFilter;
    private readonly peakingFilter;
    private readonly highShelfFilter;
    private readonly lowPassFilter;
    private readonly anyChangeCallback;
    constructor(context: AudioContext, preset: Preset);
    getFilters(): FilterNode[];
    addObserver(observer: Observer<FilterBankNodes>): Terminable;
    removeObserver(observer: Observer<FilterBankNodes>): boolean;
    terminate(): void;
    private connect;
}
