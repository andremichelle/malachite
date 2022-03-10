// noinspection JSUnusedGlobalSymbols

import {
    ArrayUtils,
    Observable,
    ObservableImpl,
    Observer,
    Option,
    Options,
    Parameter,
    Terminable,
    Terminator
} from "../lib/common.js"
import {Preset} from "./preset.js"
import {NoUIMeterWorklet} from "../meter/worklet.js"

const LogDb = Math.log(10.0) / 20.0
export const dbToGain = (db: number): number => Math.exp(db * LogDb)
export const gainToDb = (gain: number): number => Math.log(gain) / LogDb
export const SILENCE_GAIN = dbToGain(-192.0)
export const DEFAULT_INTERPOLATION_TIME: number = 0.005
export const interpolateIfNecessary = (context: BaseAudioContext, audioParam: AudioParam, value: number): void => {
    if (context.state === "running") {
        audioParam.cancelScheduledValues(context.currentTime)
        audioParam.linearRampToValueAtTime(value, context.currentTime + DEFAULT_INTERPOLATION_TIME)
    } else {
        audioParam.value = value
    }
}

const connectWithBypassSwitch = (context: AudioContext, input: AudioNode, processor: AudioNode, output: AudioNode): (bypass: boolean) => void => {
    const dryNode: GainNode = context.createGain()
    const wetNode: GainNode = context.createGain()
    dryNode.gain.value = SILENCE_GAIN
    wetNode.gain.value = 1.0
    input.connect(dryNode).connect(output)
    input.connect(wetNode).connect(processor).connect(output)
    return bypass => {
        interpolateIfNecessary(context, dryNode.gain, bypass ? 1.0 : SILENCE_GAIN)
        interpolateIfNecessary(context, wetNode.gain, bypass ? SILENCE_GAIN : 1.0)
    }
}

export interface FilterNode extends Terminable {
    enabled(): boolean

    frequency(): number

    apexDecibel(): number

    connect(input: AudioNode): AudioNode

    getFrequencyResponse(frequencyHz: Float32Array, magResponse: Float32Array, phaseResponse: Float32Array): void
}

class FilterNodeFactory {
    static createPassFilter(context: AudioContext,
                            type: "lowpass" | "highpass",
                            parameters: {
                                enabled: Parameter<boolean>,
                                frequency: Parameter<number>,
                                order: Parameter<number>,
                                q: Parameter<number>
                            },
                            anyChangeCallback: () => void): FilterNode {
        return new class implements FilterNode {
            private readonly terminator = new Terminator()
            private readonly output: AudioNode = context.createGain()
            private readonly nodes: BiquadFilterNode[] = ArrayUtils.fill(4, () => {
                const node = context.createBiquadFilter()
                node.type = type
                return node
            })
            private readonly bypassSwitches: ((bypass: boolean) => void)[] = []

            constructor() {
                this.terminator.with(parameters.enabled.addObserver(() => {
                    this.updateBypass()
                    anyChangeCallback()
                }))
                this.terminator.with(parameters.frequency.addObserver(value => {
                    this.nodes.forEach(filter => interpolateIfNecessary(context, filter.frequency, value))
                    anyChangeCallback()
                }, true))
                this.terminator.with(parameters.q.addObserver(value => {
                    this.nodes.forEach(filter => interpolateIfNecessary(context, filter.Q, value))
                    anyChangeCallback()
                }, true))
                this.terminator.with(parameters.order.addObserver(() => {
                    this.updateBypass()
                    anyChangeCallback()
                }))
            }

            enabled(): boolean {
                return parameters.enabled.get()
            }

            frequency(): number {
                return parameters.frequency.get()
            }

            apexDecibel(): number {
                // TODO
                return 0.0
            }

            connect(input: AudioNode): AudioNode {
                this.bypassSwitches.push.apply(this.bypassSwitches, this.nodes.map(node => {
                    const output = context.createGain()
                    const bypassSwitch = connectWithBypassSwitch(context, input, node, output)
                    input = output
                    return bypassSwitch
                }))
                this.updateBypass()
                return input.connect(this.output)
            }

            getFrequencyResponse(frequencyHz: Float32Array, magResponse: Float32Array, phaseResponse: Float32Array): void {
                this.nodes[0].getFrequencyResponse(frequencyHz, magResponse, phaseResponse)
                for (let i = 0; i < magResponse.length; i++) {
                    magResponse[i] = gainToDb(magResponse[i])
                }
                const order = parameters.order.get()
                if (order > 1) {
                    for (let i = 0; i < magResponse.length; i++) {
                        magResponse[i] *= order
                    }
                }
            }

            terminate(): void {
                this.terminator.terminate()
            }

            private updateBypass() {
                const order = parameters.order.get()
                const enabled = parameters.enabled.get()
                if (enabled) {
                    this.bypassSwitches.forEach((func: (bypass: boolean) => void, index: number) => func(index >= order))
                } else {
                    this.bypassSwitches.forEach((func: (bypass: boolean) => void) => func(true))
                }
            }
        }
    }

    static createShelfFilter(context: AudioContext,
                             type: "lowshelf" | "highshelf",
                             parameters: {
                                 enabled: Parameter<boolean>,
                                 frequency: Parameter<number>,
                                 gain: Parameter<number>,
                             },
                             anyChangeCallback: () => void): FilterNode {
        return new class implements FilterNode {
            private readonly terminator = new Terminator()
            private readonly output: AudioNode = context.createGain()
            private readonly node: BiquadFilterNode = context.createBiquadFilter()
            private bypassSwitch: Option<(bypass: boolean) => void> = Options.None

            constructor() {
                this.node.type = type
                this.terminator.with(parameters.enabled.addObserver(() => {
                    this.updateBypass()
                    anyChangeCallback()
                }))
                this.terminator.with(parameters.frequency.addObserver(value => {
                    interpolateIfNecessary(context, this.node.frequency, value)
                    anyChangeCallback()
                }, true))
                this.terminator.with(parameters.gain.addObserver(value => {
                    interpolateIfNecessary(context, this.node.gain, value)
                    anyChangeCallback()
                }, true))
                this.updateBypass()
            }

            enabled(): boolean {
                return parameters.enabled.get()
            }

            frequency(): number {
                return parameters.frequency.get()
            }

            apexDecibel(): number {
                return parameters.gain.get() * 0.5
            }

            connect(input: AudioNode): AudioNode {
                this.bypassSwitch = Options.valueOf(connectWithBypassSwitch(context, input, this.node, this.output))
                return this.output
            }

            getFrequencyResponse(frequencyHz: Float32Array, magResponse: Float32Array, phaseResponse: Float32Array): void {
                this.node.getFrequencyResponse(frequencyHz, magResponse, phaseResponse)
                for (let i = 0; i < magResponse.length; i++) {
                    magResponse[i] = gainToDb(magResponse[i])
                }
            }

            terminate(): void {
                this.terminator.terminate()
            }

            private updateBypass() {
                this.bypassSwitch.ifPresent((bypass: (bypass: boolean) => void) => bypass(!parameters.enabled.get()))
            }
        }
    }

    static createPeakFilter(context: AudioContext,
                            type: "peaking" | "notch",
                            parameters: {
                                enabled: Parameter<boolean>,
                                frequency: Parameter<number>,
                                gain: Parameter<number>,
                                q: Parameter<number>,
                            },
                            anyChangeCallback: () => void): FilterNode {
        return new class implements FilterNode {
            private readonly terminator = new Terminator()
            private readonly output: AudioNode = context.createGain()
            private readonly node: BiquadFilterNode = context.createBiquadFilter()

            private bypassSwitch: Option<(bypass: boolean) => void> = Options.None

            constructor() {
                this.node.type = type
                this.terminator.with(parameters.enabled.addObserver(() => {
                    this.updateBypass()
                    anyChangeCallback()
                }))
                this.terminator.with(parameters.frequency.addObserver(value => {
                    interpolateIfNecessary(context, this.node.frequency, value)
                    anyChangeCallback()
                }, true))
                this.terminator.with(parameters.gain.addObserver(value => {
                    interpolateIfNecessary(context, this.node.gain, value)
                    anyChangeCallback()
                }, true))
                this.terminator.with(parameters.q.addObserver(value => {
                    interpolateIfNecessary(context, this.node.Q, value)
                    anyChangeCallback()
                }, true))
                this.updateBypass()
            }

            enabled(): boolean {
                return parameters.enabled.get()
            }

            frequency(): number {
                return parameters.frequency.get()
            }

            apexDecibel(): number {
                return parameters.gain.get()
            }

            connect(input: AudioNode): AudioNode {
                this.bypassSwitch = Options.valueOf(connectWithBypassSwitch(context, input, this.node, this.output))
                return this.output
            }

            getFrequencyResponse(frequencyHz: Float32Array, magResponse: Float32Array, phaseResponse: Float32Array): void {
                this.node.getFrequencyResponse(frequencyHz, magResponse, phaseResponse)
                for (let i = 0; i < magResponse.length; i++) {
                    magResponse[i] = gainToDb(magResponse[i])
                }
            }

            terminate(): void {
                this.terminator.terminate()
            }

            private updateBypass() {
                this.bypassSwitch.ifPresent((bypass: (bypass: boolean) => void) => bypass(!parameters.enabled.get()))
            }
        }
    }
}

export class FilterBankNodes implements Observable<FilterBankNodes> {
    static async create(context: AudioContext, preset: Preset): Promise<FilterBankNodes> {
        await context.audioWorklet.addModule("bin/meter/processor.js")
        return new FilterBankNodes(context, preset)
    }

    private readonly terminator = new Terminator()
    private readonly observable: ObservableImpl<FilterBankNodes> = this.terminator.with(new ObservableImpl())

    private readonly inputGain: GainNode
    private readonly outputGain: GainNode
    private readonly meterNode: NoUIMeterWorklet
    private readonly analyser: AnalyserNode

    private readonly filters: FilterNode[] = []
    private readonly highPassFilter: FilterNode
    private readonly lowShelfFilter: FilterNode
    private readonly peakingFilter: FilterNode
    private readonly highShelfFilter: FilterNode
    private readonly lowPassFilter: FilterNode

    private readonly anyChangeCallback = () => this.observable.notify(this)

    constructor(readonly context: AudioContext, preset: Preset) {
        this.inputGain = context.createGain()
        this.highPassFilter = FilterNodeFactory.createPassFilter(context, "highpass", preset.filter.highPass, this.anyChangeCallback)
        this.lowShelfFilter = FilterNodeFactory.createShelfFilter(context, "lowshelf", preset.filter.lowShelf, this.anyChangeCallback)
        this.peakingFilter = FilterNodeFactory.createPeakFilter(context, "peaking", preset.filter.peaking, this.anyChangeCallback)
        this.highShelfFilter = FilterNodeFactory.createShelfFilter(context, "highshelf", preset.filter.highShelf, this.anyChangeCallback)
        this.lowPassFilter = FilterNodeFactory.createPassFilter(context, "lowpass", preset.filter.lowPass, this.anyChangeCallback)
        this.filters.push(this.highPassFilter)
        this.filters.push(this.highShelfFilter)
        this.filters.push(this.peakingFilter)
        this.filters.push(this.lowShelfFilter)
        this.filters.push(this.lowPassFilter)
        this.outputGain = context.createGain()
        this.meterNode = new NoUIMeterWorklet(context, 1, 2)
        this.analyser = context.createAnalyser()
        this.analyser.minDecibels = -72.0
        this.analyser.maxDecibels = -9.0
        this.analyser.fftSize = 2048
        this.connect(this.inputGain).connect(this.meterNode).connect(this.analyser).connect(this.outputGain)
        this.controlVolume(preset.main)
    }

    input(): AudioNode {
        return this.inputGain
    }

    output(): AudioNode {
        return this.outputGain
    }

    getFilters(): FilterNode[] {
        return this.filters
    }

    peaks(): Float32Array[] {
        return this.meterNode.peaks
    }

    computeSpectrum(spectrum: Float32Array): number {
        this.analyser.getFloatFrequencyData(spectrum)
        return this.context.sampleRate / (this.analyser.frequencyBinCount << 1)
    }

    addObserver(observer: Observer<FilterBankNodes>): Terminable {
        return this.observable.addObserver(observer)
    }

    removeObserver(observer: Observer<FilterBankNodes>): boolean {
        return this.observable.removeObserver(observer)
    }

    terminate(): void {
        this.terminator.terminate()
    }

    private connect(output: AudioNode): AudioNode {
        this.filters.forEach(filter => output = filter.connect(output))
        return output
    }

    private controlVolume(setting: {
        gain: Parameter<number>,
        bypass: Parameter<boolean>
    }) {
        const update = () => {
            interpolateIfNecessary(this.context, this.outputGain.gain, setting.bypass.get() ? 0.0 : dbToGain(setting.gain.get()))
        }
        this.terminator.with(setting.gain.addObserver(update))
        this.terminator.with(setting.bypass.addObserver(update))
        update()
    }
}