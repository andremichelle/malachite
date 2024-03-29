import {cosine, Terminable, Terminator} from "../lib/common.js"
import {MalachiteKnob, MalachiteMeter, MalachiteScreen, MalachiteSwitch} from "../ui.js"
import {Preset} from "./preset.js"
import {Exp, Linear} from "../lib/mapping.js"
import {FilterBankNodes, FilterNode} from "./nodes.js"

export class FilterSpectrumRenderer {
    constructor(private readonly screen: MalachiteScreen) {
    }

    render(spectrum: Float32Array, step: number) {
        const screen = this.screen
        const width = screen.width()
        const height = screen.height()
        const context = screen.context
        const numBins = spectrum.length
        let x0 = 0
        let lastEnergy = spectrum[0]
        let currentEnergy = lastEnergy
        context.strokeStyle = `rgba(${0x35}, ${0x8F}, ${0x6F}, 1.0)`
        context.fillStyle = `rgba(${0x35}, ${0x8F}, ${0x6F}, 0.2)`
        context.beginPath()
        context.moveTo(-1, height)
        context.lineTo(-1, screen.unitToY(lastEnergy))
        for (let i = 1; i < numBins; ++i) {
            const energy = spectrum[i]
            if (currentEnergy > energy) {
                currentEnergy = energy
            }
            let x1 = Math.floor(screen.unitToX(i * step))
            if (x1 > width) {
                i = numBins
                x1 = width
            }
            if (x0 < x1) {
                const xn = x1 - x0
                if (2 >= xn) {
                    context.lineTo(x1, screen.unitToY(currentEnergy))
                } else {
                    const scale = 1.0 / xn
                    const y1 = screen.unitToY(lastEnergy)
                    const y2 = screen.unitToY(currentEnergy)
                    for (let x = 1; x <= xn; ++x) {
                        context.lineTo(x0 + x, cosine(y1, y2, x * scale))
                    }
                }
                lastEnergy = currentEnergy
                currentEnergy = 0.0
            }
            x0 = x1
        }
        context.lineTo(width, height)
        context.closePath()
        context.fill()
        context.stroke()
    }
}

export class FilterBankResponseRenderer {
    private static Colors: string[] = ["#89C9B2", "#56A78A", "#1E7B5A", "#0B6243", "#358F6F"]

    private readonly frequencyHz: Float32Array
    private readonly phaseResponse: Float32Array
    private readonly magResponse: Float32Array
    private readonly magSum: Float32Array

    constructor(private readonly screen: MalachiteScreen) {
        const width = screen.width() + 1
        this.frequencyHz = new Float32Array(width)
        this.phaseResponse = new Float32Array(width)
        this.magResponse = new Float32Array(width)
        this.magSum = new Float32Array(width)
        for (let x = 0; x < width; x++) {
            this.frequencyHz[x] = screen.xToUnit(x)
        }
    }

    render(filters: FilterNode[]): void {
        const screen = this.screen
        const context = screen.context
        const width = screen.width()
        context.lineWidth = 0.0
        context.globalAlpha = 0.4
        context.globalCompositeOperation = "screen"
        this.magSum.fill(0.0)
        filters.forEach((filter: FilterNode, index: number) => {
            if (!filter.enabled()) return
            context.fillStyle = FilterBankResponseRenderer.Colors[index]
            filter.getFrequencyResponse(this.frequencyHz, this.magResponse, this.phaseResponse)
            const xc = Math.floor(screen.unitToX(filter.frequency()))
            const db0 = this.magResponse[0]
            this.magSum[0] += db0
            const y0 = screen.unitToY(db0)
            context.beginPath()
            context.moveTo(0, y0)
            const xn = this.frequencyHz.length
            let x = 1
            for (; x < xc; ++x) {
                const db = this.magResponse[x]
                this.magSum[x] += db
                const y1 = screen.unitToY(db)
                context.lineTo(x, y1)
            }
            for (; x < xn; ++x) {
                const db = this.magResponse[x]
                this.magSum[x] += db
                const y1 = screen.unitToY(db)
                context.lineTo(x, y1)
            }
            context.lineTo(width, screen.unitToY(0.0))
            context.lineTo(0, screen.unitToY(0.0))
            context.fill()
        })
        context.beginPath()
        context.globalAlpha = 1.0
        context.strokeStyle = "white"
        context.moveTo(0, screen.unitToY(this.magSum[0]))
        const n = this.frequencyHz.length
        for (let x = 1; x <= n; ++x) {
            context.lineTo(x, screen.unitToY(this.magSum[x]))
        }
        context.stroke()
    }
}

export class FilterBankUI implements Terminable {
    private static SCREEN_FREQUENCY_RANGE = new Exp(20.0, 20000.0)

    private readonly terminator = new Terminator()

    private readonly responseScreen = new MalachiteScreen(document.querySelector("canvas.screen.response"), FilterBankUI.SCREEN_FREQUENCY_RANGE, new Linear(40.0, -40.0))
    private readonly spectrumScreen = new MalachiteScreen(document.querySelector("canvas.screen.spectrum"), FilterBankUI.SCREEN_FREQUENCY_RANGE, new Linear(-6.0, -72.0))
    private readonly response = new FilterBankResponseRenderer(this.responseScreen)
    private readonly spectrum = new FilterSpectrumRenderer(this.spectrumScreen)

    private readonly meterL: MalachiteMeter
    private readonly meterR: MalachiteMeter

    private needsResponseUpdate: boolean = true

    constructor(private readonly nodes: FilterBankNodes, preset: Preset) {
        {
            this.terminator.with(new MalachiteSwitch(document.querySelector("label.checkbox[data-parameter='main-bypass']")))
                .with(preset.main.bypass)
            this.terminator.with(new MalachiteKnob(document.querySelector("div.knob[data-parameter='main-gain']")))
                .with(preset.main.gain)
        }
        {
            const element = document.querySelector("[data-parameter-group='highpass']")
            this.terminator.with(new MalachiteSwitch(element.querySelector("label.checkbox[data-parameter='enabled']")))
                .with(preset.filter.highPass.enabled)
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='frequency']")))
                .with(preset.filter.highPass.frequency)
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='order']"), MalachiteKnob.MODIFY_STRENGTH_QUICK))
                .with(preset.filter.highPass.order)
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='q']")))
                .with(preset.filter.highPass.q)
        }
        {
            const element = document.querySelector("[data-parameter-group='lowshelf']")
            this.terminator.with(new MalachiteSwitch(element.querySelector("label.checkbox[data-parameter='enabled']")))
                .with(preset.filter.lowShelf.enabled)
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='frequency']")))
                .with(preset.filter.lowShelf.frequency)
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='gain']")))
                .with(preset.filter.lowShelf.gain)
        }
        {
            const element = document.querySelector("[data-parameter-group='peak']")
            this.terminator.with(new MalachiteSwitch(element.querySelector("label.checkbox[data-parameter='enabled']")))
                .with(preset.filter.peaking.enabled)
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='frequency']")))
                .with(preset.filter.peaking.frequency)
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='gain']")))
                .with(preset.filter.peaking.gain)
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='q']")))
                .with(preset.filter.peaking.q)
        }
        {
            const element = document.querySelector("[data-parameter-group='highshelf']")
            this.terminator.with(new MalachiteSwitch(element.querySelector("label.checkbox[data-parameter='enabled']")))
                .with(preset.filter.highShelf.enabled)
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='frequency']")))
                .with(preset.filter.highShelf.frequency)
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='gain']")))
                .with(preset.filter.highShelf.gain)
        }
        {
            const element = document.querySelector("[data-parameter-group='lowpass']")
            this.terminator.with(new MalachiteSwitch(element.querySelector("label.checkbox[data-parameter='enabled']")))
                .with(preset.filter.lowPass.enabled)
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='frequency']")))
                .with(preset.filter.lowPass.frequency)
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='order']"), MalachiteKnob.MODIFY_STRENGTH_QUICK))
                .with(preset.filter.lowPass.order)
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='q']")))
                .with(preset.filter.lowPass.q)
        }
        this.terminator.with(nodes.addObserver(() => this.needsResponseUpdate = true))

        this.meterL = new MalachiteMeter(document.querySelector("div.meter.left"))
        this.meterR = new MalachiteMeter(document.querySelector("div.meter.right"))
    }

    setMeterValues(values: Float32Array[]) {
        this.meterL.setValue(values[0][0])
        this.meterR.setValue(values[0][1])
    }

    terminate(): void {
        this.terminator.terminate()
    }

    run() {
        const spectrum: Float32Array = new Float32Array(2048)
        const nextFrame = () => {
            this.setMeterValues(this.nodes.peaks())
            if (this.needsResponseUpdate) {
                this.responseScreen.clear()
                this.response.render(this.nodes.getFilters())
                this.needsResponseUpdate = false
            }
            const freqStep: number = this.nodes.computeSpectrum(spectrum)
            this.spectrumScreen.clear()
            this.spectrum.render(spectrum, freqStep)
            requestAnimationFrame(nextFrame)
        }
        nextFrame()
    }
}