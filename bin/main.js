var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { fetchMicrophone, Parameter, PrintMapping } from "./lib/common.js";
import { initPreset } from "./filterbank/preset.js";
import { FilterBankNodes } from "./filterbank/nodes.js";
import { FilterBankUI } from "./filterbank/ui.js";
import { MalachiteSwitch } from "./ui.js";
import { BooleanMapping } from "./lib/mapping.js";
const initSources = (context, nodes) => {
    const demoAudio = new Audio();
    demoAudio.src = "kepz.126.mp3";
    demoAudio.preload = "auto";
    demoAudio.crossOrigin = "*";
    const mediaElementSource = context.createMediaElementSource(demoAudio);
    mediaElementSource.connect(nodes.input());
    const booleanPrintMapping = PrintMapping.createBoolean("Running", "None");
    const parameterDemo = new Parameter(BooleanMapping.Instance, booleanPrintMapping, false);
    const parameterMicro = new Parameter(BooleanMapping.Instance, booleanPrintMapping, false);
    const parameters = [parameterDemo, parameterMicro];
    parameterDemo.addObserver((running) => __awaiter(void 0, void 0, void 0, function* () {
        if (running) {
            if (context.state !== "running") {
                yield context.resume();
            }
            yield demoAudio.play();
        }
        else {
            yield demoAudio.pause();
            demoAudio.currentTime = 0.0;
        }
    }));
    parameterMicro.addObserver((() => {
        let stream;
        let streamSource;
        return (running) => __awaiter(void 0, void 0, void 0, function* () {
            if (running) {
                yield context.resume();
                stream = yield fetchMicrophone();
                streamSource = context.createMediaStreamSource(stream);
                streamSource.connect(nodes.input());
            }
            else {
                streamSource.disconnect();
                streamSource = null;
            }
        });
    })());
    const update = (() => {
        let updatable = true;
        return (parameter) => {
            if (updatable) {
                updatable = false;
                parameters.filter(other => other !== parameter).forEach(parameter => parameter.set(false));
                updatable = true;
            }
        };
    })();
    parameters.forEach(parameter => parameter.addObserver(() => update(parameter)));
    new MalachiteSwitch(document.querySelector("label[data-action='demo']")).with(parameterDemo);
    new MalachiteSwitch(document.querySelector("label[data-action='micro']")).with(parameterMicro);
};
(() => __awaiter(void 0, void 0, void 0, function* () {
    document.body.classList.add("invisible");
    const context = new AudioContext();
    const preset = initPreset();
    const nodes = yield FilterBankNodes.create(context, preset);
    initSources(context, nodes);
    nodes.output().connect(context.destination);
    const ui = new FilterBankUI(nodes, preset);
    ui.run();
    document.body.classList.remove("invisible");
}))();
//# sourceMappingURL=main.js.map