import { Terminable } from "./lib/common.js";
import { MalachiteScreen } from "./ui.js";
import { Preset } from "./filter-bank-preset.js";
import { FilterBankNodes, FilterNode } from "./filter-bank-nodes.js";
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
    private readonly terminator;
    private readonly screen;
    private readonly response;
    constructor(preset: Preset, nodes: FilterBankNodes);
    terminate(): void;
}
