var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { MalachiteKnob, MalachiteSwitch } from "./ui.js";
import { Exp } from "./lib/mapping.js";
import { Parameter, PrintMapping } from "./lib/common.js";
(() => __awaiter(void 0, void 0, void 0, function* () {
    const parameter = new Parameter(new Exp(20, 20000), PrintMapping.smallFloat(1, "Hz"), 100);
    document.querySelectorAll("div.knob").forEach(element => new MalachiteKnob(element).with(parameter));
    document.querySelectorAll("label.checkbox").forEach(element => new MalachiteSwitch(element).with(parameter));
}))();
//# sourceMappingURL=main.js.map