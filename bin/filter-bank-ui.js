import { Terminator } from "./lib/common.js";
import { MalachiteKnob, MalachiteSwitch } from "./ui.js";
export class FilterBankUI {
    constructor(preset) {
        this.terminator = new Terminator();
        {
            this.terminator.with(new MalachiteSwitch(document.querySelector("label.checkbox[data-parameter='main-bypass']")))
                .with(preset.main.bypass);
            this.terminator.with(new MalachiteKnob(document.querySelector("div.knob[data-parameter='main-gain']")))
                .with(preset.main.gain);
        }
        {
            const element = document.querySelector("[data-parameter-group='highpass']");
            this.terminator.with(new MalachiteSwitch(element.querySelector("label.checkbox[data-parameter='enabled']")))
                .with(preset.filter.highPass.enabled);
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='frequency']")))
                .with(preset.filter.highPass.frequency);
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='order']")))
                .with(preset.filter.highPass.order);
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='q']")))
                .with(preset.filter.highPass.q);
        }
        {
            const element = document.querySelector("[data-parameter-group='lowshelf']");
            this.terminator.with(new MalachiteSwitch(element.querySelector("label.checkbox[data-parameter='enabled']")))
                .with(preset.filter.lowShelf.enabled);
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='frequency']")))
                .with(preset.filter.lowShelf.frequency);
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='gain']")))
                .with(preset.filter.lowShelf.gain);
        }
        {
            const element = document.querySelector("[data-parameter-group='peak']");
            this.terminator.with(new MalachiteSwitch(element.querySelector("label.checkbox[data-parameter='enabled']")))
                .with(preset.filter.peak.enabled);
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='frequency']")))
                .with(preset.filter.peak.frequency);
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='gain']")))
                .with(preset.filter.peak.gain);
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='q']")))
                .with(preset.filter.peak.q);
        }
        {
            const element = document.querySelector("[data-parameter-group='highshelf']");
            this.terminator.with(new MalachiteSwitch(element.querySelector("label.checkbox[data-parameter='enabled']")))
                .with(preset.filter.highShelf.enabled);
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='frequency']")))
                .with(preset.filter.highShelf.frequency);
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='gain']")))
                .with(preset.filter.highShelf.gain);
        }
        {
            const element = document.querySelector("[data-parameter-group='lowpass']");
            this.terminator.with(new MalachiteSwitch(element.querySelector("label.checkbox[data-parameter='enabled']")))
                .with(preset.filter.lowPass.enabled);
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='frequency']")))
                .with(preset.filter.lowPass.frequency);
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='order']")))
                .with(preset.filter.lowPass.order);
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='q']")))
                .with(preset.filter.lowPass.q);
        }
    }
    terminate() {
        this.terminator.terminate();
    }
}
//# sourceMappingURL=filter-bank-ui.js.map