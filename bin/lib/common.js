import { Linear } from "./mapping.js";
export const cosine = (y1, y2, mu) => {
    const mu2 = (1.0 - Math.cos(mu * Math.PI)) * 0.5;
    return y1 * (1.0 - mu2) + y2 * mu2;
};
export class TerminableVoid {
    terminate() {
    }
}
TerminableVoid.Instance = new TerminableVoid();
export class Terminator {
    constructor() {
        this.terminables = [];
    }
    with(terminable) {
        this.terminables.push(terminable);
        return terminable;
    }
    terminate() {
        while (this.terminables.length) {
            this.terminables.pop().terminate();
        }
    }
}
export class Options {
    static valueOf(value) {
        return null === value || undefined === value ? Options.None : new Options.Some(value);
    }
}
Options.Some = class {
    constructor(value) {
        this.value = value;
        this.get = () => this.value;
        this.contains = (value) => value === this.value;
        this.ifPresent = (callback) => callback(this.value);
        this.isEmpty = () => false;
        this.nonEmpty = () => true;
        console.assert(null !== value && undefined !== value, "Cannot be null or undefined");
    }
    toString() {
        return `Options.Some(${this.value})`;
    }
};
Options.None = new class {
    constructor() {
        this.get = () => {
            throw new Error("Option has no value");
        };
        this.contains = (_) => false;
        this.ifPresent = (_) => {
        };
        this.isEmpty = () => true;
        this.nonEmpty = () => false;
    }
    toString() {
        return `Options.None`;
    }
};
export class ObservableImpl {
    constructor() {
        this.observers = [];
    }
    notify(value) {
        this.observers.forEach(observer => observer(value));
    }
    addObserver(observer) {
        this.observers.push(observer);
        return { terminate: () => this.removeObserver(observer) };
    }
    removeObserver(observer) {
        let index = this.observers.indexOf(observer);
        if (-1 < index) {
            this.observers.splice(index, 1);
            return true;
        }
        return false;
    }
    terminate() {
        this.observers.splice(0, this.observers.length);
    }
}
export class ObservableValueImpl {
    constructor(value) {
        this.value = value;
        this.observable = new ObservableImpl();
    }
    get() {
        return this.value;
    }
    set(value) {
        if (this.value === value) {
            return false;
        }
        this.value = value;
        this.observable.notify(value);
        return true;
    }
    addObserver(observer, notify = false) {
        if (notify)
            observer(this.value);
        return this.observable.addObserver(observer);
    }
    removeObserver(observer) {
        return this.observable.removeObserver(observer);
    }
    terminate() {
        this.observable.terminate();
    }
}
export class BoundNumericValue {
    constructor(range = Linear.Identity, value = 0.0) {
        this.range = range;
        this.observable = new ObservableImpl();
        this.set(value);
    }
    get() {
        return this.value;
    }
    set(value) {
        value = this.range.clamp(value);
        if (this.value === value) {
            return false;
        }
        this.value = value;
        this.observable.notify(value);
        return true;
    }
    addObserver(observer, notify = false) {
        if (notify)
            observer(this.value);
        return this.observable.addObserver(observer);
    }
    removeObserver(observer) {
        return this.observable.removeObserver(observer);
    }
    terminate() {
        this.observable.terminate();
    }
}
export class Parameter {
    constructor(valueMapping, printMapping, value) {
        this.valueMapping = valueMapping;
        this.printMapping = printMapping;
        this.value = value;
        this.observable = new ObservableImpl();
    }
    getUnipolar() {
        return this.valueMapping.x(this.value);
    }
    setUnipolar(value) {
        this.set(this.valueMapping.y(value));
    }
    print() {
        return this.printMapping.print(this.value);
    }
    get() {
        return this.value;
    }
    set(value) {
        if (value === this.value) {
            return;
        }
        this.value = value;
        this.observable.notify(value);
        return true;
    }
    addObserver(observer, notify = false) {
        if (notify)
            observer(this.value);
        return this.observable.addObserver(observer);
    }
    removeObserver(observer) {
        return this.observable.removeObserver(observer);
    }
    terminate() {
        this.observable.terminate();
    }
}
export class PrintMapping {
    constructor(parser, printer, preUnit = "", postUnit = "") {
        this.parser = parser;
        this.printer = printer;
        this.preUnit = preUnit;
        this.postUnit = postUnit;
    }
    static createBoolean(trueValue, falseValue) {
        return new PrintMapping(text => {
            return trueValue.toLowerCase() === text.toLowerCase();
        }, value => value ? trueValue : falseValue);
    }
    static integer(postUnit) {
        return new PrintMapping(text => {
            const value = parseInt(text, 10);
            if (isNaN(value))
                return null;
            return Math.round(value) | 0;
        }, value => String(value), "", postUnit);
    }
    static float(numPrecision, preUnit, postUnit) {
        return new PrintMapping(text => {
            const value = parseFloat(text);
            if (isNaN(value))
                return null;
            return value;
        }, value => {
            if (isNaN(value)) {
                return "N/A";
            }
            if (!isFinite(value)) {
                return value < 0.0 ? "-∞" : "∞";
            }
            return value.toFixed(numPrecision);
        }, preUnit, postUnit);
    }
    static smallFloat(numPrecision, postUnit) {
        return new PrintMapping(text => {
            const value = parseFloat(text);
            if (isNaN(value))
                return null;
            return text.toLowerCase().includes("k") ? value * 1000.0 : value;
        }, value => {
            if (value >= 1000.0) {
                return `${(value / 1000.0).toFixed(numPrecision)}k`;
            }
            return value.toFixed(numPrecision);
        }, "", postUnit);
    }
    parse(text) {
        return this.parser(text.replace(this.preUnit, "").replace(this.postUnit, ""));
    }
    print(value) {
        return undefined === value ? "" : `${this.preUnit}${this.printer(value)}${this.postUnit}`;
    }
}
PrintMapping.UnipolarPercent = new PrintMapping(text => {
    const value = parseFloat(text);
    if (isNaN(value))
        return null;
    return value / 100.0;
}, value => (value * 100.0).toFixed(1), "", "%");
PrintMapping.RGB = new PrintMapping(text => {
    if (3 === text.length) {
        text = text.charAt(0) + text.charAt(0) + text.charAt(1) + text.charAt(1) + text.charAt(2) + text.charAt(2);
    }
    if (6 === text.length) {
        return parseInt(text, 16);
    }
    else {
        return null;
    }
}, value => value.toString(16).padStart(6, "0").toUpperCase(), "#", "");
export const binarySearch = (values, key) => {
    let low = 0 | 0;
    let high = (values.length - 1) | 0;
    while (low <= high) {
        const mid = (low + high) >>> 1;
        const midVal = values[mid];
        if (midVal < key)
            low = mid + 1;
        else if (midVal > key)
            high = mid - 1;
        else {
            if (midVal === key)
                return mid;
            else if (midVal < key)
                low = mid + 1;
            else
                high = mid - 1;
        }
    }
    return high;
};
export class ArrayUtils {
    static fill(n, factory) {
        const array = [];
        for (let i = 0; i < n; i++) {
            array[i] = factory(i);
        }
        return array;
    }
    constructor() {
    }
}
//# sourceMappingURL=common.js.map