import {fetchMicrophone, Parameter, PrintMapping} from "./lib/common.js"
import {initPreset} from "./filterbank/preset.js"
import {FilterBankNodes} from "./filterbank/nodes.js"
import {FilterBankUI} from "./filterbank/ui.js"
import {MalachiteSwitch} from "./ui.js"
import {BooleanMapping} from "./lib/mapping.js"

const initSources = (context: AudioContext, nodes: FilterBankNodes): void => {
    const demoAudio = new Audio()
    demoAudio.src = "kepz.126.mp3"
    demoAudio.preload = "auto"
    demoAudio.crossOrigin = "*"
    const mediaElementSource = context.createMediaElementSource(demoAudio)
    mediaElementSource.connect(nodes.input())
    const booleanPrintMapping = PrintMapping.createBoolean("Running", "None")
    const parameterDemo = new Parameter<boolean>(BooleanMapping.Instance, booleanPrintMapping, false)
    const parameterMicro = new Parameter<boolean>(BooleanMapping.Instance, booleanPrintMapping, false)
    const parameters: Parameter<boolean>[] = [parameterDemo, parameterMicro]
    parameterDemo.addObserver(async running => {
        if (running) {
            await context.resume()
            demoAudio.play()
        } else {
            await demoAudio.pause()
            demoAudio.currentTime = 0.0
        }
    })
    parameterMicro.addObserver((() => {
        let stream: MediaStream
        let streamSource: MediaStreamAudioSourceNode
        return async running => {
            if (running) {
                await context.resume()
                stream = await fetchMicrophone()
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
}

(async () => {
    document.body.classList.add("invisible")
    const context = new AudioContext()
    const preset = initPreset()
    const nodes = await FilterBankNodes.create(context, preset)
    initSources(context, nodes)
    nodes.output().connect(context.destination)
    const ui = new FilterBankUI(nodes, preset)
    ui.run()
    document.body.classList.remove("invisible")
})()