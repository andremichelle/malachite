import { Terminable } from "../lib/common.js";
import { MalachiteScreen } from "../ui.js";
import { Preset } from "./preset.js";
import { FilterBankNodes, FilterNode } from "./nodes.js";
export declare class FilterSpectrumRenderer {
    private readonly screen;
    constructor(screen: MalachiteScreen);
    render(spectrum: Float32Array, step: number): void;
}
export declare class FilterBankResponseRenderer {
    private readonly screen;
    private static Colors;
    private readonly frequencyHz;
    private readonly phaseResponse;
    private readonly magResponse;
    private readonly magSum;
    constructor(screen: MalachiteScreen);
    render(filters: FilterNode[]): void;
}
export declare class FilterBankUI implements Terminable {
    private readonly nodes;
    private static SCREEN_FREQUENCY_RANGE;
    private readonly terminator;
    private readonly responseScreen;
    private readonly spectrumScreen;
    private readonly response;
    private readonly spectrum;
    private readonly meterL;
    private readonly meterR;
    private needsResponseUpdate;
    constructor(nodes: FilterBankNodes, preset: Preset);
    setMeterValues(values: Float32Array[]): void;
    terminate(): void;
    run(): void;
}
