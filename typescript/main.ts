import {createPreset} from "./filter-bank-preset.js"
import {FilterBankUI} from "./filter-bank-ui.js"

(async () => {
    new FilterBankUI(createPreset())
})()