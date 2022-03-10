var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ArrayUtils, ObservableImpl, Options, Terminator } from "../lib/common.js";
import { NoUIMeterWorklet } from "../meter/worklet.js";
const LogDb = Math.log(10.0) / 20.0;
export const dbToGain = (db) => Math.exp(db * LogDb);
export const gainToDb = (gain) => Math.log(gain) / LogDb;
export const SILENCE_GAIN = dbToGain(-192.0);
export const DEFAULT_INTERPOLATION_TIME = 0.005;
export const interpolateIfNecessary = (context, audioParam, value) => {
    if (context.state === "running") {
        audioParam.cancelScheduledValues(context.currentTime);
        audioParam.linearRampToValueAtTime(value, context.currentTime + DEFAULT_INTERPOLATION_TIME);
    }
    else {
        audioParam.value = value;
    }
};
const connectWithBypassSwitch = (context, input, processor, output) => {
    const dryNode = context.createGain();
    const wetNode = context.createGain();
    dryNode.gain.value = SILENCE_GAIN;
    wetNode.gain.value = 1.0;
    input.connect(dryNode).connect(output);
    input.connect(wetNode).connect(processor).connect(output);
    return bypass => {
        interpolateIfNecessary(context, dryNode.gain, bypass ? 1.0 : SILENCE_GAIN);
        interpolateIfNecessary(context, wetNode.gain, bypass ? SILENCE_GAIN : 1.0);
    };
};
class FilterNodeFactory {
    static createPassFilter(context, type, parameters, anyChangeCallback) {
        return new class {
            constructor() {
                this.terminator = new Terminator();
                this.output = context.createGain();
                this.nodes = ArrayUtils.fill(4, () => {
                    const node = context.createBiquadFilter();
                    node.type = type;
                    return node;
                });
                this.bypassSwitches = [];
                this.terminator.with(parameters.enabled.addObserver(() => {
                    this.updateBypass();
                    anyChangeCallback();
                }));
                this.terminator.with(parameters.frequency.addObserver(value => {
                    this.nodes.forEach(filter => interpolateIfNecessary(context, filter.frequency, value));
                    anyChangeCallback();
                }, true));
                this.terminator.with(parameters.q.addObserver(value => {
                    this.nodes.forEach(filter => interpolateIfNecessary(context, filter.Q, value));
                    anyChangeCallback();
                }, true));
                this.terminator.with(parameters.order.addObserver(() => {
                    this.updateBypass();
                    anyChangeCallback();
                }));
            }
            enabled() {
                return parameters.enabled.get();
            }
            frequency() {
                return parameters.frequency.get();
            }
            apexDecibel() {
                return parameters.q.get() * parameters.order.get();
            }
            connect(input) {
                this.bypassSwitches.push.apply(this.bypassSwitches, this.nodes.map(node => {
                    const output = context.createGain();
                    const bypassSwitch = connectWithBypassSwitch(context, input, node, output);
                    input = output;
                    return bypassSwitch;
                }));
                this.updateBypass();
                return input.connect(this.output);
            }
            getFrequencyResponse(frequencyHz, magResponse, phaseResponse) {
                this.nodes[0].getFrequencyResponse(frequencyHz, magResponse, phaseResponse);
                for (let i = 0; i < magResponse.length; i++) {
                    magResponse[i] = gainToDb(magResponse[i]);
                }
                const order = parameters.order.get();
                if (order > 1) {
                    for (let i = 0; i < magResponse.length; i++) {
                        magResponse[i] *= order;
                    }
                }
            }
            terminate() {
                this.terminator.terminate();
            }
            updateBypass() {
                const order = parameters.order.get();
                const enabled = parameters.enabled.get();
                if (enabled) {
                    this.bypassSwitches.forEach((func, index) => func(index >= order));
                }
                else {
                    this.bypassSwitches.forEach((func) => func(true));
                }
            }
        };
    }
    static createShelfFilter(context, type, parameters, anyChangeCallback) {
        return new class {
            constructor() {
                this.terminator = new Terminator();
                this.output = context.createGain();
                this.node = context.createBiquadFilter();
                this.bypassSwitch = Options.None;
                this.node.type = type;
                this.terminator.with(parameters.enabled.addObserver(() => {
                    this.updateBypass();
                    anyChangeCallback();
                }));
                this.terminator.with(parameters.frequency.addObserver(value => {
                    interpolateIfNecessary(context, this.node.frequency, value);
                    anyChangeCallback();
                }, true));
                this.terminator.with(parameters.gain.addObserver(value => {
                    interpolateIfNecessary(context, this.node.gain, value);
                    anyChangeCallback();
                }, true));
                this.updateBypass();
            }
            enabled() {
                return parameters.enabled.get();
            }
            frequency() {
                return parameters.frequency.get();
            }
            apexDecibel() {
                return parameters.gain.get() * 0.5;
            }
            connect(input) {
                this.bypassSwitch = Options.valueOf(connectWithBypassSwitch(context, input, this.node, this.output));
                return this.output;
            }
            getFrequencyResponse(frequencyHz, magResponse, phaseResponse) {
                this.node.getFrequencyResponse(frequencyHz, magResponse, phaseResponse);
                for (let i = 0; i < magResponse.length; i++) {
                    magResponse[i] = gainToDb(magResponse[i]);
                }
            }
            terminate() {
                this.terminator.terminate();
            }
            updateBypass() {
                this.bypassSwitch.ifPresent((bypass) => bypass(!parameters.enabled.get()));
            }
        };
    }
    static createPeakFilter(context, type, parameters, anyChangeCallback) {
        return new class {
            constructor() {
                this.terminator = new Terminator();
                this.output = context.createGain();
                this.node = context.createBiquadFilter();
                this.bypassSwitch = Options.None;
                this.node.type = type;
                this.terminator.with(parameters.enabled.addObserver(() => {
                    this.updateBypass();
                    anyChangeCallback();
                }));
                this.terminator.with(parameters.frequency.addObserver(value => {
                    interpolateIfNecessary(context, this.node.frequency, value);
                    anyChangeCallback();
                }, true));
                this.terminator.with(parameters.gain.addObserver(value => {
                    interpolateIfNecessary(context, this.node.gain, value);
                    anyChangeCallback();
                }, true));
                this.terminator.with(parameters.q.addObserver(value => {
                    interpolateIfNecessary(context, this.node.Q, value);
                    anyChangeCallback();
                }, true));
                this.updateBypass();
            }
            enabled() {
                return parameters.enabled.get();
            }
            frequency() {
                return parameters.frequency.get();
            }
            apexDecibel() {
                return parameters.gain.get();
            }
            connect(input) {
                this.bypassSwitch = Options.valueOf(connectWithBypassSwitch(context, input, this.node, this.output));
                return this.output;
            }
            getFrequencyResponse(frequencyHz, magResponse, phaseResponse) {
                this.node.getFrequencyResponse(frequencyHz, magResponse, phaseResponse);
                for (let i = 0; i < magResponse.length; i++) {
                    magResponse[i] = gainToDb(magResponse[i]);
                }
            }
            terminate() {
                this.terminator.terminate();
            }
            updateBypass() {
                this.bypassSwitch.ifPresent((bypass) => bypass(!parameters.enabled.get()));
            }
        };
    }
}
export class FilterBankNodes {
    constructor(context, preset) {
        this.context = context;
        this.terminator = new Terminator();
        this.observable = this.terminator.with(new ObservableImpl());
        this.filters = [];
        this.anyChangeCallback = () => this.observable.notify(this);
        this.inputGain = context.createGain();
        this.highPassFilter = FilterNodeFactory.createPassFilter(context, "highpass", preset.filter.highPass, this.anyChangeCallback);
        this.lowShelfFilter = FilterNodeFactory.createShelfFilter(context, "lowshelf", preset.filter.lowShelf, this.anyChangeCallback);
        this.peakingFilter = FilterNodeFactory.createPeakFilter(context, "peaking", preset.filter.peaking, this.anyChangeCallback);
        this.highShelfFilter = FilterNodeFactory.createShelfFilter(context, "highshelf", preset.filter.highShelf, this.anyChangeCallback);
        this.lowPassFilter = FilterNodeFactory.createPassFilter(context, "lowpass", preset.filter.lowPass, this.anyChangeCallback);
        this.filters.push(this.highPassFilter);
        this.filters.push(this.highShelfFilter);
        this.filters.push(this.peakingFilter);
        this.filters.push(this.lowShelfFilter);
        this.filters.push(this.lowPassFilter);
        this.outputGain = context.createGain();
        this.meterNode = new NoUIMeterWorklet(context, 1, 2);
        this.analyser = context.createAnalyser();
        this.analyser.minDecibels = -72.0;
        this.analyser.maxDecibels = -9.0;
        this.analyser.fftSize = 2048;
        this.connect(this.inputGain).connect(this.meterNode).connect(this.analyser).connect(this.outputGain);
        this.controlVolume(preset.main);
    }
    static create(context, preset) {
        return __awaiter(this, void 0, void 0, function* () {
            yield context.audioWorklet.addModule("src/meter/processor.js");
            return new FilterBankNodes(context, preset);
        });
    }
    input() {
        return this.inputGain;
    }
    output() {
        return this.outputGain;
    }
    getFilters() {
        return this.filters;
    }
    peaks() {
        return this.meterNode.peaks;
    }
    computeSpectrum(spectrum) {
        this.analyser.getFloatFrequencyData(spectrum);
        return this.context.sampleRate / (this.analyser.frequencyBinCount << 1);
    }
    addObserver(observer) {
        return this.observable.addObserver(observer);
    }
    removeObserver(observer) {
        return this.observable.removeObserver(observer);
    }
    terminate() {
        this.terminator.terminate();
    }
    connect(output) {
        this.filters.forEach(filter => output = filter.connect(output));
        return output;
    }
    controlVolume(setting) {
        const update = () => {
            interpolateIfNecessary(this.context, this.outputGain.gain, setting.bypass.get() ? 0.0 : dbToGain(setting.gain.get()));
        };
        this.terminator.with(setting.gain.addObserver(update));
        this.terminator.with(setting.bypass.addObserver(update));
        update();
    }
}
//# sourceMappingURL=nodes.js.map