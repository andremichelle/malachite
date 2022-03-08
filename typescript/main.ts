import {MalachiteKnob, MalachiteSwitch} from "./ui.js"
import {Boolean, Exp, Linear, LinearInteger, Volume} from "./lib/mapping.js"
import {Parameter, PrintMapping, Terminator} from "./lib/common.js"

const createPreset = () => {
    const FILTER_FREQ_MAPPING = new Exp(20.0, 20000.0)
    const FILTER_GAIN_MAPPING = new Linear(-40.0, 40.0)
    const DEFAULT_Q = 1.0 / Math.sqrt(2.0)
    const FILTER_Q_MAPPING = new Exp(0.01, 10.0)
    return {
        main: {
            gain: new Parameter<number>(new Volume(-72.0, 0.0, 6.0), PrintMapping.float(1, "", "db"), 0.0),
            bypass: new Parameter<boolean>(Boolean.Instance, PrintMapping.createBoolean("Bypass", "On"), false)
        },
        filter: {
            highPass: {
                enabled: new Parameter<boolean>(Boolean.Instance, PrintMapping.createBoolean("On", "Off"), true),
                frequency: new Parameter<number>(FILTER_FREQ_MAPPING, PrintMapping.smallFloat(1, "Hz"), FILTER_FREQ_MAPPING.min),
                order: new Parameter<number>(new LinearInteger(1, 4), PrintMapping.integer(""), 4),
                q: new Parameter<number>(FILTER_Q_MAPPING, PrintMapping.float(2, "", ""), DEFAULT_Q)
            },
            lowShelf: {
                enabled: new Parameter<boolean>(Boolean.Instance, PrintMapping.createBoolean("On", "Off"), true),
                frequency: new Parameter<number>(FILTER_FREQ_MAPPING, PrintMapping.smallFloat(1, "Hz"), FILTER_FREQ_MAPPING.y(0.25)),
                gain: new Parameter<number>(FILTER_GAIN_MAPPING, PrintMapping.float(1, "", "db"), 0.0)
            },
            peak: {
                enabled: new Parameter<boolean>(Boolean.Instance, PrintMapping.createBoolean("On", "Off"), true),
                frequency: new Parameter<number>(FILTER_FREQ_MAPPING, PrintMapping.smallFloat(1, "Hz"), FILTER_FREQ_MAPPING.y(0.5)),
                gain: new Parameter<number>(FILTER_GAIN_MAPPING, PrintMapping.float(1, "", "db"), 0.0),
                q: new Parameter<number>(FILTER_Q_MAPPING, PrintMapping.float(2, "", ""), DEFAULT_Q)
            },
            highShelf: {
                enabled: new Parameter<boolean>(Boolean.Instance, PrintMapping.createBoolean("On", "Off"), true),
                frequency: new Parameter<number>(FILTER_FREQ_MAPPING, PrintMapping.smallFloat(1, "Hz"), FILTER_FREQ_MAPPING.y(0.75)),
                gain: new Parameter<number>(FILTER_GAIN_MAPPING, PrintMapping.float(1, "", "db"), 0.0)
            },
            lowPass: {
                enabled: new Parameter<boolean>(Boolean.Instance, PrintMapping.createBoolean("On", "Off"), true),
                frequency: new Parameter<number>(FILTER_FREQ_MAPPING, PrintMapping.smallFloat(1, "Hz"), FILTER_FREQ_MAPPING.max),
                order: new Parameter<number>(new LinearInteger(1, 4), PrintMapping.integer(""), 4),
                q: new Parameter<number>(FILTER_Q_MAPPING, PrintMapping.float(2, "", ""), DEFAULT_Q)
            }
        }
    }
}

(async () => {
    const terminator = new Terminator()
    const preset = createPreset()
    {
        terminator.with(new MalachiteSwitch(document.querySelector("label.checkbox[data-parameter='main-bypass']"))).with(preset.main.bypass)
        terminator.with(new MalachiteKnob(document.querySelector("div.knob[data-parameter='main-gain']"))).with(preset.main.gain)
    }
    {
        const element = document.querySelector("[data-parameter-group='highpass']")
        terminator.with(new MalachiteSwitch(element.querySelector("label.checkbox[data-parameter='enabled']")))
            .with(preset.filter.highPass.enabled)
        terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='frequency']")))
            .with(preset.filter.highPass.frequency)
        terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='order']")))
            .with(preset.filter.highPass.order)
        terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='q']")))
            .with(preset.filter.highPass.q)
    }
    {
        const element = document.querySelector("[data-parameter-group='lowshelf']")
        terminator.with(new MalachiteSwitch(element.querySelector("label.checkbox[data-parameter='enabled']")))
            .with(preset.filter.lowShelf.enabled)
        terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='frequency']")))
            .with(preset.filter.lowShelf.frequency)
        terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='gain']")))
            .with(preset.filter.lowShelf.gain)
    }
    {
        const element = document.querySelector("[data-parameter-group='peak']")
        terminator.with(new MalachiteSwitch(element.querySelector("label.checkbox[data-parameter='enabled']")))
            .with(preset.filter.peak.enabled)
        terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='frequency']")))
            .with(preset.filter.peak.frequency)
        terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='gain']")))
            .with(preset.filter.peak.gain)
        terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='q']")))
            .with(preset.filter.peak.q)
    }
    {
        const element = document.querySelector("[data-parameter-group='highshelf']")
        terminator.with(new MalachiteSwitch(element.querySelector("label.checkbox[data-parameter='enabled']")))
            .with(preset.filter.highShelf.enabled)
        terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='frequency']")))
            .with(preset.filter.highShelf.frequency)
        terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='gain']")))
            .with(preset.filter.highShelf.gain)
    }
    {
        const element = document.querySelector("[data-parameter-group='lowpass']")
        terminator.with(new MalachiteSwitch(element.querySelector("label.checkbox[data-parameter='enabled']")))
            .with(preset.filter.lowPass.enabled)
        terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='frequency']")))
            .with(preset.filter.lowPass.frequency)
        terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='order']")))
            .with(preset.filter.lowPass.order)
        terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='q']")))
            .with(preset.filter.lowPass.q)
    }
})()