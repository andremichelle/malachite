import { Observable, Observer, Terminable } from "../lib/common.js";
import { Preset } from "./preset.js";
export declare const dbToGain: (db: number) => number;
export declare const gainToDb: (gain: number) => number;
export declare const SILENCE_GAIN: number;
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
    static create(context: AudioContext, preset: Preset): Promise<FilterBankNodes>;
    private readonly terminator;
    private readonly observable;
    private readonly inputGain;
    private readonly outputGain;
    private readonly meterNode;
    private readonly filters;
    private readonly highPassFilter;
    private readonly lowShelfFilter;
    private readonly peakingFilter;
    private readonly highShelfFilter;
    private readonly lowPassFilter;
    private readonly anyChangeCallback;
    constructor(context: AudioContext, preset: Preset);
    input(): AudioNode;
    output(): AudioNode;
    getFilters(): FilterNode[];
    peaks(): Float32Array[];
    addObserver(observer: Observer<FilterBankNodes>): Terminable;
    removeObserver(observer: Observer<FilterBankNodes>): boolean;
    terminate(): void;
    private connect;
    private controlVolume;
}
