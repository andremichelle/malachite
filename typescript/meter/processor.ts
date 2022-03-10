// import {ArrayUtils, RENDER_QUANTUM, RMS} from "../lib/common.js"

// FIREFOX DOES NOT ALLOW IMPORTS, SO WE REPEAT THE CODE HERE
//
class RMS {
    private readonly values: Float32Array
    private readonly inv: number
    private sum: number
    private index: number

    constructor(private readonly n: number) {
        this.values = new Float32Array(n)
        this.inv = 1.0 / n
        this.sum = 0.0
        this.index = 0 | 0
    }

    pushPop(squared: number): number {
        this.sum -= this.values[this.index]
        this.sum += squared
        this.values[this.index] = squared
        if (++this.index === this.n) this.index = 0
        return 0.0 >= this.sum ? 0.0 : Math.sqrt(this.sum * this.inv)
    }
}

class ArrayUtils {
    static fill<T>(n: number, factory: (index: number) => T): T[] {
        const array: T[] = []
        for (let i = 0; i < n; i++) {
            array[i] = factory(i)
        }
        return array
    }

    // noinspection JSUnusedLocalSymbols
    private constructor() {
    }
}

const RENDER_QUANTUM: number = 128 | 0

registerProcessor("dsp-meter", class extends AudioWorkletProcessor {
    private readonly numberOfLines: number
    private readonly channelCount: number

    private readonly maxPeaks: Float32Array[]
    private readonly maxSquares: Float32Array[]
    private readonly updateRate: number
    private readonly rmsChannels: RMS[][]

    private updateCount: number = 0 | 0

    constructor(options) {
        super(options)

        this.numberOfLines = options.numberOfInputs
        this.channelCount = options.channelCount
        console.assert(options.numberOfOutputs === this.numberOfLines)

        this.maxPeaks = ArrayUtils.fill(this.numberOfLines, () => new Float32Array(this.channelCount))
        this.maxSquares = ArrayUtils.fill(this.numberOfLines, () => new Float32Array(this.channelCount))

        const rmsSize: number = sampleRate * 0.050 // 50ms
        const fps: number = 60.0
        this.updateRate = (sampleRate / fps) | 0
        this.rmsChannels = ArrayUtils.fill(this.numberOfLines, () => ArrayUtils.fill(this.channelCount, () => new RMS(rmsSize)))
    }

    // noinspection JSUnusedGlobalSymbols
    process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
        for (let lineIndex = 0; lineIndex < this.numberOfLines; lineIndex++) {
            const input: Float32Array[] = inputs[lineIndex]
            const output: Float32Array[] = outputs[lineIndex]
            for (let channel: number = 0; channel < this.channelCount; ++channel) {
                const inputChannel: Float32Array = input[channel]
                const outputChannel: Float32Array = output[channel]
                const rms: RMS = this.rmsChannels[lineIndex][channel]
                if (undefined === inputChannel) {
                    this.maxPeaks[lineIndex][channel] = 0.0
                    this.maxSquares[lineIndex][channel] = 0.0
                } else {
                    let maxPeak: number = this.maxPeaks[lineIndex][channel]
                    let maxSquare: number = this.maxSquares[lineIndex][channel]
                    for (let i: number = 0; i < RENDER_QUANTUM; ++i) {
                        const inp: number = outputChannel[i] = inputChannel[i] // we pass the signal
                        maxPeak = Math.max(maxPeak, Math.abs(inp))
                        maxSquare = Math.max(maxSquare, rms.pushPop(inp * inp))
                    }
                    this.maxPeaks[lineIndex][channel] = maxPeak
                    this.maxSquares[lineIndex][channel] = maxSquare
                }
            }
        }
        this.updateCount += RENDER_QUANTUM
        if (this.updateCount >= this.updateRate) {
            this.updateCount -= this.updateRate
            this.port.postMessage({type: "update-meter", maxSquares: this.maxSquares, maxPeaks: this.maxPeaks})
            for (let lineIndex = 0; lineIndex < this.numberOfLines; lineIndex++) {
                for (let channelIndex: number = 0; channelIndex < this.channelCount; ++channelIndex) {
                    this.maxPeaks[lineIndex][channelIndex] *= 0.93
                    this.maxSquares[lineIndex][channelIndex] *= 0.93
                }
            }
        }
        return true
    }
})