import {Parameter, preloadImagesOfCssFile, PrintMapping} from "./lib/common.js"
import {initPreset} from "./filterbank/preset.js"
import {FilterBankNodes} from "./filterbank/nodes.js"
import {FilterBankUI} from "./filterbank/ui.js"
import {Events, MalachiteSwitch} from "./ui.js"
import {BooleanMapping} from "./lib/mapping.js"

const initSources = async (context: AudioContext, nodes: FilterBankNodes): Promise<void> => {
    const demoAudio = new Audio()
    demoAudio.src = "kepz.126.mp3"
    demoAudio.preload = "auto"
    demoAudio.crossOrigin = "*"
    demoAudio.load()
    await Events.toPromise(demoAudio, "canplaythrough")
    const mediaElementSource = context.createMediaElementSource(demoAudio)
    mediaElementSource.connect(nodes.input())
    const booleanPrintMapping = PrintMapping.createBoolean("Running", "None")
    const parameterDemo = new Parameter<boolean>(BooleanMapping.Instance, booleanPrintMapping, false)
    const parameterMicro = new Parameter<boolean>(BooleanMapping.Instance, booleanPrintMapping, false)
    const parameters: Parameter<boolean>[] = [parameterDemo, parameterMicro]
    const startAudioContext = () => {
        if (context.state !== "running") {
            document.querySelectorAll("svg.play-hint").forEach(svg => svg.remove())
            context.resume()
        }
    }
    parameterDemo.addObserver((running: boolean) => {
        if (running) {
            startAudioContext()
            demoAudio.play()
        } else {
            demoAudio.pause()
            demoAudio.currentTime = 0.0
        }
    })
    parameterMicro.addObserver((() => {
        let stream: MediaStream
        let streamSource: MediaStreamAudioSourceNode
        return async (running: boolean) => {
            if (running) {
                startAudioContext()
                stream = await navigator.mediaDevices.getUserMedia({audio: true})
                streamSource = context.createMediaStreamSource(stream)
                streamSource.connect(nodes.input())
            } else {
                streamSource.disconnect()
                streamSource = null
            }
        }
    })())
    const update = (() => {
        let updatable = true
        return (parameter: Parameter<boolean>) => {
            if (updatable) {
                updatable = false
                parameters.filter(other => other !== parameter).forEach(parameter => parameter.set(false))
                updatable = true
            }
        }
    })()
    parameters.forEach(parameter => parameter.addObserver(() => update(parameter)))
    new MalachiteSwitch(document.querySelector("label[data-action='demo']")).with(parameterDemo)
    new MalachiteSwitch(document.querySelector("label[data-action='micro']")).with(parameterMicro)
    return Promise.resolve()
}

(async () => {
    await preloadImagesOfCssFile("./bin/main.css")
    const context = new AudioContext()
    const preset = initPreset()
    const nodes = await FilterBankNodes.create(context, preset)
    await initSources(context, nodes)
    const ui = new FilterBankUI(nodes, preset)
    ui.run()

    document.querySelector(".preloader").remove()
    document.addEventListener('touchmove', (event: TouchEvent) => event.preventDefault(), {passive: false})
    requestAnimationFrame(() => document.querySelector("main").classList.remove("invisible"))
})()