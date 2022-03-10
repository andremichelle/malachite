import {readAudio, Terminator} from "./lib/common.js"
import {initPreset} from "./filterbank/preset.js"
import {FilterBankNodes} from "./filterbank/nodes.js"
import {FilterBankUI} from "./filterbank/ui.js"

(async () => {
    const context = new AudioContext()
    const preset = initPreset()
    const filterBankNodes = await FilterBankNodes.create(context, preset)
    filterBankNodes.output().connect(context.destination)
    const filterBankUI = new FilterBankUI(preset, filterBankNodes)

    const run = () => {
        filterBankUI.setMeterValues(filterBankNodes.peaks())
        requestAnimationFrame(run)
    }
    requestAnimationFrame(run)

    const terminator = new Terminator()
    const buffer = await readAudio(context, "samples/loop.wav")
    document.querySelector("label[data-action='demo']").addEventListener("click", async () => {
        terminator.terminate()
        await context.resume()
        const bufferSource = context.createBufferSource()
        bufferSource.buffer = buffer
        bufferSource.loop = true
        bufferSource.start()
        bufferSource.connect(filterBankNodes.input())
        terminator.with({
            terminate() {
                bufferSource.stop()
                bufferSource.disconnect()
            }
        })
    })
})()