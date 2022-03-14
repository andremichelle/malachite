var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Parameter, preloadImagesOfCssFile, PrintMapping } from "./lib/common.js";
import { initPreset } from "./filterbank/preset.js";
import { FilterBankNodes } from "./filterbank/nodes.js";
import { FilterBankUI } from "./filterbank/ui.js";
import { Events, MalachiteSwitch } from "./ui.js";
import { BooleanMapping } from "./lib/mapping.js";
const initSources = (context, nodes) => __awaiter(void 0, void 0, void 0, function* () {
    const demoAudio = new Audio();
    demoAudio.src = "kepz.126.mp3";
    demoAudio.preload = "auto";
    demoAudio.crossOrigin = "*";
    demoAudio.load();
    yield Events.toPromise(demoAudio, "canplaythrough");
    const mediaElementSource = context.createMediaElementSource(demoAudio);
    mediaElementSource.connect(nodes.input());
    const booleanPrintMapping = PrintMapping.createBoolean("Running", "None");
    const parameterDemo = new Parameter(BooleanMapping.Instance, booleanPrintMapping, false);
    const parameterMicro = new Parameter(BooleanMapping.Instance, booleanPrintMapping, false);
    const parameters = [parameterDemo, parameterMicro];
    const startAudioContext = () => {
        if (context.state !== "running") {
            document.querySelectorAll("svg.play-hint").forEach(svg => svg.remove());
            context.resume();
        }
    };
    parameterDemo.addObserver((running) => {
        if (running) {
            startAudioContext();
            demoAudio.play();
        }
        else {
            demoAudio.pause();
            demoAudio.currentTime = 0.0;
        }
    });
    parameterMicro.addObserver((() => {
        let stream;
        let streamSource;
        return (running) => __awaiter(void 0, void 0, void 0, function* () {
            if (running) {
                startAudioContext();
                stream = yield navigator.mediaDevices.getUserMedia({ audio: true });
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
    return Promise.resolve();
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield preloadImagesOfCssFile("./bin/main.css");
    const context = new AudioContext();
    const preset = initPreset();
    const nodes = yield FilterBankNodes.create(context, preset);
    yield initSources(context, nodes);
    const ui = new FilterBankUI(nodes, preset);
    ui.run();
    document.querySelector(".preloader").remove();
    document.addEventListener('touchmove', (event) => event.preventDefault(), { passive: false });
    requestAnimationFrame(() => document.querySelector("main").classList.remove("invisible"));
}))();
//# sourceMappingURL=main.js.map