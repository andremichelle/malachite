import {Terminable, Terminator} from "../lib/common.js"
import {MalachiteKnob, MalachiteMeter, MalachiteScreen, MalachiteSwitch} from "../ui.js"
import {Preset} from "./preset.js"
import {Exp, Linear} from "../lib/mapping.js"
import {FilterBankNodes, FilterNode, gainToDb} from "./nodes.js"

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
        context.clearRect(0, 0, width, screen.height())
        context.lineWidth = 0.0
        context.globalAlpha = 0.4
        context.globalCompositeOperation = "screen"
        this.magSum.fill(0.0)
        filters.forEach((filter: FilterNode, index: number) => {
            if (!filter.enabled()) return
            context.fillStyle = FilterBankResponseRenderer.Colors[index]
            filter.getFrequencyResponse(this.frequencyHz, this.magResponse, this.phaseResponse)
            const xc = Math.floor(screen.unitToX(filter.frequency()))
            const apexDb = filter.apexDecibel()
            const db0 = 0 == xc ? apexDb : gainToDb(this.magResponse[0])
            this.magSum[0] += db0
            const y0 = screen.unitToY(db0)
            context.beginPath()
            context.moveTo(0, y0)
            const xn = this.frequencyHz.length
            for (let x = 1; x < xc; ++x) {
                const db = gainToDb(this.magResponse[x])
                this.magSum[x] += db
                const y1 = screen.unitToY(db)
                context.lineTo(x, y1)
            }
            if (0 != xc) {
                const db = filter.apexDecibel()
                this.magSum[xc] += db
                const y1 = screen.unitToY(db)
                context.lineTo(xc, y1)
            }
            for (let x = xc + 1; x < xn; ++x) {
                const db = gainToDb(this.magResponse[x])
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
    private readonly terminator = new Terminator()

    private readonly screen = new MalachiteScreen(document.querySelector("canvas.screen"), new Exp(20.0, 20000.0), new Linear(40.0, -40.0))
    private readonly response = new FilterBankResponseRenderer(this.screen)

    private readonly meterL: MalachiteMeter
    private readonly meterR: MalachiteMeter

    constructor(preset: Preset, nodes: FilterBankNodes) {
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
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='order']")))
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
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='order']")))
                .with(preset.filter.lowPass.order)
            this.terminator.with(new MalachiteKnob(element.querySelector("div.knob[data-parameter='q']")))
                .with(preset.filter.lowPass.q)
        }
        this.terminator.with(nodes.addObserver(nodes => this.response.render(nodes.getFilters())))
        this.response.render(nodes.getFilters())

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
}