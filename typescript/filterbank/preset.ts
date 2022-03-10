import {Boolean, Exp, Linear, LinearInteger, Volume} from "../lib/mapping.js"
import {Parameter, PrintMapping} from "../lib/common.js"

export type Preset = {
    main: {
        gain: Parameter<number>,
        bypass: Parameter<boolean>
    },
    filter: {
        highPass: {
            enabled: Parameter<boolean>
            frequency: Parameter<number>
            order: Parameter<number>
            q: Parameter<number>
        },
        lowShelf: {
            enabled: Parameter<boolean>
            frequency: Parameter<number>
            gain: Parameter<number>
        },
        peaking: {
            enabled: Parameter<boolean>
            frequency: Parameter<number>
            gain: Parameter<number>
            q: Parameter<number>
        },
        highShelf: {
            enabled: Parameter<boolean>
            frequency: Parameter<number>
            gain: Parameter<number>
        },
        lowPass: {
            enabled: Parameter<boolean>
            frequency: Parameter<number>
            order: Parameter<number>
            q: Parameter<number>
        }
    }
}

export const initPreset = (): Preset => {
    const GAIN_PRINT = PrintMapping.float(1, "", "db")
    const MAIN_GAIN_MAPPING = new Volume(-72.0, 0.0, 6.0)
    const FILTER_FREQ_MAPPING = new Exp(20.0, 20000.0)
    const FILTER_GAIN_MAPPING = new Linear(-40.0, 40.0)
    const FILTER_DEFAULT_Q = 1.0 / Math.sqrt(2.0)
    const FILTER_Q_MAPPING = new Exp(0.01, 10.0)
    const FILTER_ENABLED_PRINT = PrintMapping.createBoolean("On", "Off")
    const FILTER_ORDER_MAPPING = new LinearInteger(1, 4)
    const FILTER_ORDER_PRINT = PrintMapping.integer("")
    const FILTER_FREQ_PRINT = PrintMapping.smallFloat(1, "Hz")
    const FILTER_Q_PRINT = PrintMapping.float(2, "", "")
    const MAIN_BYPASS_PRINT = PrintMapping.createBoolean("Bypass", "On")
    return {
        main: {
            gain: new Parameter<number>(MAIN_GAIN_MAPPING, GAIN_PRINT, 0.0),
            bypass: new Parameter<boolean>(Boolean.Instance, MAIN_BYPASS_PRINT, false)
        },
        filter: {
            highPass: {
                enabled: new Parameter<boolean>(Boolean.Instance, FILTER_ENABLED_PRINT, true),
                frequency: new Parameter<number>(FILTER_FREQ_MAPPING, FILTER_FREQ_PRINT, FILTER_FREQ_MAPPING.min),
                order: new Parameter<number>(FILTER_ORDER_MAPPING, FILTER_ORDER_PRINT, 4),
                q: new Parameter<number>(FILTER_Q_MAPPING, FILTER_Q_PRINT, FILTER_DEFAULT_Q)
            },
            lowShelf: {
                enabled: new Parameter<boolean>(Boolean.Instance, FILTER_ENABLED_PRINT, true),
                frequency: new Parameter<number>(FILTER_FREQ_MAPPING, FILTER_FREQ_PRINT, FILTER_FREQ_MAPPING.y(0.25)),
                gain: new Parameter<number>(FILTER_GAIN_MAPPING, GAIN_PRINT, 0.0)
            },
            peaking: {
                enabled: new Parameter<boolean>(Boolean.Instance, FILTER_ENABLED_PRINT, true),
                frequency: new Parameter<number>(FILTER_FREQ_MAPPING, FILTER_FREQ_PRINT, FILTER_FREQ_MAPPING.y(0.5)),
                gain: new Parameter<number>(FILTER_GAIN_MAPPING, GAIN_PRINT, 0.0),
                q: new Parameter<number>(FILTER_Q_MAPPING, FILTER_Q_PRINT, FILTER_DEFAULT_Q)
            },
            highShelf: {
                enabled: new Parameter<boolean>(Boolean.Instance, FILTER_ENABLED_PRINT, true),
                frequency: new Parameter<number>(FILTER_FREQ_MAPPING, FILTER_FREQ_PRINT, FILTER_FREQ_MAPPING.y(0.75)),
                gain: new Parameter<number>(FILTER_GAIN_MAPPING, GAIN_PRINT, 0.0)
            },
            lowPass: {
                enabled: new Parameter<boolean>(Boolean.Instance, FILTER_ENABLED_PRINT, true),
                frequency: new Parameter<number>(FILTER_FREQ_MAPPING, FILTER_FREQ_PRINT, FILTER_FREQ_MAPPING.max),
                order: new Parameter<number>(FILTER_ORDER_MAPPING, FILTER_ORDER_PRINT, 4),
                q: new Parameter<number>(FILTER_Q_MAPPING, FILTER_Q_PRINT, FILTER_DEFAULT_Q)
            }
        }
    }
}