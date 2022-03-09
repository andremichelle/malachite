import { ArrayUtils, Terminator } from "./lib/common.js";
const LogDb = Math.log(10.0) / 20.0;
export const dbToGain = (db) => Math.exp(db * LogDb);
export const gainToDb = (gain) => Math.log(gain) / LogDb;
const createFilter = (context, type) => {
    const filter = context.createBiquadFilter();
    filter.type = type;
    return filter;
};
export class FilterBankDSP {
    constructor(context) {
        this.terminator = new Terminator();
        this.filters = [];
        this.inputGain = context.createGain();
        this.outputGain = context.createGain();
        this.highPass = ArrayUtils.fill(4, () => createFilter(context, "highpass"));
        this.lowShelf = [createFilter(context, "lowshelf")];
        this.peaking = [createFilter(context, "peaking")];
        this.highShelf = [createFilter(context, "highshelf")];
        this.lowPass = ArrayUtils.fill(4, () => createFilter(context, "lowpass"));
        this.filters.push(this.highPass);
        this.filters.push(this.lowShelf);
        this.filters.push(this.peaking);
        this.filters.push(this.highShelf);
        this.filters.push(this.lowPass);
    }
    applyPreset(preset) {
        this.terminator.with(preset.filter.highPass.frequency
            .addObserver(value => this.highPass.forEach(filter => filter.frequency.value = value), true));
        this.terminator.with(preset.filter.highPass.q
            .addObserver(value => this.highPass.forEach(filter => filter.Q.value = value), true));
        this.terminator.with(preset.filter.lowShelf.frequency
            .addObserver(value => this.lowShelf.forEach(filter => filter.frequency.value = value), true));
        this.terminator.with(preset.filter.lowShelf.gain
            .addObserver(value => this.lowShelf.forEach(filter => filter.gain.value = value), true));
        this.terminator.with(preset.filter.peaking.frequency
            .addObserver(value => this.peaking.forEach(filter => filter.frequency.value = value), true));
        this.terminator.with(preset.filter.peaking.gain
            .addObserver(value => this.peaking.forEach(filter => filter.gain.value = value), true));
        this.terminator.with(preset.filter.peaking.q
            .addObserver(value => this.peaking.forEach(filter => filter.Q.value = value), true));
        this.terminator.with(preset.filter.highShelf.frequency
            .addObserver(value => this.highShelf.forEach(filter => filter.frequency.value = value), true));
        this.terminator.with(preset.filter.highShelf.gain
            .addObserver(value => this.highShelf.forEach(filter => filter.gain.value = value), true));
        this.terminator.with(preset.filter.lowPass.frequency
            .addObserver(value => this.lowPass.forEach(filter => filter.frequency.value = value), true));
        this.terminator.with(preset.filter.lowPass.q
            .addObserver(value => this.lowPass.forEach(filter => filter.Q.value = value), true));
    }
}
//# sourceMappingURL=filter-bank-dsp.js.map