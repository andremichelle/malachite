import {initPreset} from "./filter-bank-preset.js"
import {FilterBankUI} from "./filter-bank-ui.js"
import {FilterBankNodes} from "./filter-bank-nodes.js"

(async () => {
    const context = new AudioContext()
    const preset = initPreset()
    const filterBankNodes = new FilterBankNodes(context, preset)
    const filterBankUI = new FilterBankUI(preset, filterBankNodes)
})()