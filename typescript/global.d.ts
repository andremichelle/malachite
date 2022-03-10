interface AudioWorkletProcessor {
    port: MessagePort
}

declare var AudioWorkletProcessor: {
    prototype: AudioWorkletProcessor
    port: MessagePort
    new(option?: any): AudioWorkletProcessor
    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: { [name: string]: Float32Array }): boolean
}

declare var sampleRate: number

declare function registerProcessor<T extends AudioWorkletProcessor>(name: string, processorCtor: T): void