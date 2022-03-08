import { Terminable } from "./lib/common.js";
import { Preset } from "./filter-bank-preset.js";
export declare class FilterBankUI implements Terminable {
    private readonly terminator;
    constructor(preset: Preset);
    terminate(): void;
}
