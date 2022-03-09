import { ArrayUtils, ObservableImpl, Options, Terminator } from "./lib/common.js";
const LogDb = Math.log(10.0) / 20.0;
export const dbToGain = (db) => Math.exp(db * LogDb);
export const gainToDb = (gain) => Math.log(gain) / LogDb;
export const DEFAULT_INTERPOLATION_TIME = 0.005;
export const interpolateIfNecessary = (context, audioParam, value) => {
    if (context.state === "running") {
        audioParam.value = value;
    }
    else {
        audioParam.linearRampToValueAtTime(value, context.currentTime + DEFAULT_INTERPOLATION_TIME);
    }
};
const connectWithBypassSwitch = (context, input, processor, output) => {
    const dryNode = context.createGain();
    const wetNode = context.createGain();
    dryNode.gain.value = 0.0;
    wetNode.gain.value = 1.0;
    input.connect(dryNode).connect(output);
    input.connect(wetNode).connect(processor).connect(output);
    return bypass => {
        interpolateIfNecessary(context, dryNode.gain, bypass ? 1.0 : 0.0);
        interpolateIfNecessary(context, wetNode.gain, bypass ? 0.0 : 1.0);
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
                this.updateBypass();
            }
            enabled() {
                return parameters.enabled.get();
            }
            frequency() {
                return parameters.frequency.get();
            }
            apexDecibel() {
                return parameters.q.get();
            }
            connect(input) {
                this.bypassSwitches.push.apply(this.bypassSwitches, this.nodes.map(node => connectWithBypassSwitch(context, input, node, this.output)));
                return this.output;
            }
            getFrequencyResponse(frequencyHz, magResponse, phaseResponse) {
                this.nodes[0].getFrequencyResponse(frequencyHz, magResponse, phaseResponse);
                const order = parameters.order.get();
                if (order > 1) {
                    for (let i = 0; i < magResponse.length; i++) {
                        magResponse[i] = Math.pow(magResponse[i], order);
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
        this.connect(this.inputGain).connect(this.outputGain);
    }
    getFilters() {
        return this.filters;
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
}
//# sourceMappingURL=filter-bank-nodes.js.map