import {fetchMicrophone, Parameter, PrintMapping} from "./lib/common.js"
import {initPreset} from "./filterbank/preset.js"
import {FilterBankNodes} from "./filterbank/nodes.js"
import {FilterBankUI} from "./filterbank/ui.js"
import {MalachiteSwitch} from "./ui.js"
import {BooleanMapping} from "./lib/mapping.js"

/**
 * TODO
 * Check license
 * Units on screen
 * Responsive size
 * Update curve next frame
 * Firefox
 */

const initSources = (context: AudioContext, filterBankNodes: FilterBankNodes): void => {
    const demoAudio = new Audio()
    // https://www.audiotool.com/track/a7twbfiog/
    demoAudio.src = "goon.assberg.mp3"
    demoAudio.preload = "auto"
    demoAudio.crossOrigin = "*"
    const mediaElementSource = context.createMediaElementSource(demoAudio)
    mediaElementSource.connect(filterBankNodes.input())
    const booleanPrintMapping = PrintMapping.createBoolean("Running", "None")
    const parameterDemo = new Parameter<boolean>(BooleanMapping.Instance, booleanPrintMapping, false)
    const parameterMicro = new Parameter<boolean>(BooleanMapping.Instance, booleanPrintMapping, false)
    const parameters: Parameter<boolean>[] = [parameterDemo, parameterMicro]
    parameterDemo.addObserver(async running => {
        if (running) {
            await context.resume()
            await demoAudio.play()
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
                streamSource.connect(filterBankNodes.input())
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
    const filterBankNodes = await FilterBankNodes.create(context, preset)
    filterBankNodes.output().connect(context.destination)
    const filterBankUI = new FilterBankUI(preset, filterBankNodes)
    initSources(context, filterBankNodes)
    const run = () => {
        filterBankUI.setMeterValues(filterBankNodes.peaks())
        requestAnimationFrame(run)
    }
    run()
    document.body.classList.remove("invisible")
})()