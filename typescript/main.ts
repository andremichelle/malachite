import {MalachiteKnob, MalachiteSwitch} from "./ui.js"
import {Exp} from "./lib/mapping.js"
import {Parameter, PrintMapping} from "./lib/common.js"

(async () => {

    const parameter = new Parameter(new Exp(20, 20000), PrintMapping.smallFloat(1, "Hz"), 8000)

    document.querySelectorAll("div.knob").forEach(element => new MalachiteKnob(element).with(parameter))
    document.querySelectorAll("label.checkbox").forEach(element => new MalachiteSwitch(element).with(parameter))
})()