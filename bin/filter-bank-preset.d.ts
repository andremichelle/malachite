import { Parameter } from "./lib/common.js";
export declare type Preset = {
    main: {
        gain: Parameter<number>;
        bypass: Parameter<boolean>;
    };
    filter: {
        highPass: {
            enabled: Parameter<boolean>;
            frequency: Parameter<number>;
            order: Parameter<number>;
            q: Parameter<number>;
        };
        lowShelf: {
            enabled: Parameter<boolean>;
            frequency: Parameter<number>;
            gain: Parameter<number>;
        };
        peak: {
            enabled: Parameter<boolean>;
            frequency: Parameter<number>;
            gain: Parameter<number>;
            q: Parameter<number>;
        };
        highShelf: {
            enabled: Parameter<boolean>;
            frequency: Parameter<number>;
            gain: Parameter<number>;
        };
        lowPass: {
            enabled: Parameter<boolean>;
            frequency: Parameter<number>;
            order: Parameter<number>;
            q: Parameter<number>;
        };
    };
};
export declare const createPreset: () => Preset;
