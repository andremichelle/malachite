var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { readAudio, Terminator } from "./lib/common.js";
import { initPreset } from "./filterbank/preset.js";
import { FilterBankNodes } from "./filterbank/nodes.js";
import { FilterBankUI } from "./filterbank/ui.js";
(() => __awaiter(void 0, void 0, void 0, function* () {
    const context = new AudioContext();
    const preset = initPreset();
    const filterBankNodes = yield FilterBankNodes.create(context, preset);
    filterBankNodes.output().connect(context.destination);
    const filterBankUI = new FilterBankUI(preset, filterBankNodes);
    const run = () => {
        filterBankUI.setMeterValues(filterBankNodes.peaks());
        requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
    const terminator = new Terminator();
    const buffer = yield readAudio(context, "samples/loop.wav");
    document.querySelector("label[data-action='demo']").addEventListener("click", () => __awaiter(void 0, void 0, void 0, function* () {
        terminator.terminate();
        yield context.resume();
        const bufferSource = context.createBufferSource();
        bufferSource.buffer = buffer;
        bufferSource.loop = true;
        bufferSource.start();
        bufferSource.connect(filterBankNodes.input());
        terminator.with({
            terminate() {
                bufferSource.stop();
                bufferSource.disconnect();
            }
        });
    }));
}))();
//# sourceMappingURL=main.js.map