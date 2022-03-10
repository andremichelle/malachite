import { Linear } from "./mapping.js";
export const RENDER_QUANTUM = 128 | 0;
export class RMS {
    constructor(n) {
        this.n = n;
        this.values = new Float32Array(n);
        this.inv = 1.0 / n;
        this.sum = 0.0;
        this.index = 0 | 0;
    }
    pushPop(squared) {
        this.sum -= this.values[this.index];
        this.sum += squared;
        this.values[this.index] = squared;
        if (++this.index === this.n)
            this.index = 0;
        return 0.0 >= this.sum ? 0.0 : Math.sqrt(this.sum * this.inv);
    }
    clear() {
        this.values.fill(0.0);
        this.sum = 0.0;
        this.index = 0 | 0;
    }
}
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
export class Boot {
    constructor() {
        this.observable = new ObservableImpl();
        this.completion = new Promise((resolve) => {
            this.observable.addObserver(boot => {
                if (boot.isCompleted()) {
                    requestAnimationFrame(() => resolve());
                    boot.terminate();
                }
            });
        });
        this.finishedTasks = 0 | 0;
        this.totalTasks = 0 | 0;
        this.completed = false;
    }
    addObserver(observer) {
        return this.observable.addObserver(observer);
    }
    removeObserver(observer) {
        return this.observable.removeObserver(observer);
    }
    terminate() {
        this.observable.terminate();
    }
    registerProcess(promise) {
        console.assert(!this.completed, "Cannot register processes when boot is already completed.");
        promise.then(() => {
            this.finishedTasks++;
            if (this.isCompleted())
                this.completed = true;
            this.observable.notify(this);
        });
        this.totalTasks++;
        return promise;
    }
    isCompleted() {
        return this.finishedTasks === this.totalTasks;
    }
    normalizedPercentage() {
        return this.finishedTasks / this.totalTasks;
    }
    percentage() {
        return Math.round(this.normalizedPercentage() * 100.0);
    }
    waitForCompletion() {
        return this.completion;
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
export class ObservableValueVoid {
    addObserver(observer) {
        return TerminableVoid.Instance;
    }
    get() {
    }
    removeObserver(observer) {
        return false;
    }
    set(value) {
        return true;
    }
    terminate() {
    }
}
ObservableValueVoid.Instance = new ObservableValueVoid();
export var CollectionEventType;
(function (CollectionEventType) {
    CollectionEventType[CollectionEventType["Add"] = 0] = "Add";
    CollectionEventType[CollectionEventType["Remove"] = 1] = "Remove";
    CollectionEventType[CollectionEventType["Order"] = 2] = "Order";
})(CollectionEventType || (CollectionEventType = {}));
export class CollectionEvent {
    constructor(collection, type, item = null, index = -1) {
        this.collection = collection;
        this.type = type;
        this.item = item;
        this.index = index;
    }
}
export class ObservableCollection {
    constructor() {
        this.observable = new ObservableImpl();
        this.items = [];
    }
    static observeNested(collection, observer) {
        const itemObserver = _ => observer(collection);
        const observers = new Map();
        collection.forEach((observable) => observers.set(observable, observable.addObserver(itemObserver, false)));
        collection.addObserver((event) => {
            if (event.type === CollectionEventType.Add) {
                observers.set(event.item, event.item.addObserver(itemObserver, false));
            }
            else if (event.type === CollectionEventType.Remove) {
                const observer = observers.get(event.item);
                console.assert(observer !== undefined);
                observers.delete(event.item);
                observer.terminate();
            }
            else if (event.type === CollectionEventType.Order) {
            }
            observer(collection);
        });
        return {
            terminate() {
                observers.forEach((value) => value.terminate());
                observers.clear();
            }
        };
    }
    add(value, index = Number.MAX_SAFE_INTEGER) {
        console.assert(0 <= index);
        index = Math.min(index, this.items.length);
        if (this.items.includes(value))
            return false;
        this.items.splice(index, 0, value);
        this.observable.notify(new CollectionEvent(this, CollectionEventType.Add, value, index));
        return true;
    }
    addAll(values) {
        for (const value of values) {
            this.add(value);
        }
    }
    remove(value) {
        return this.removeIndex(this.items.indexOf(value));
    }
    removeIndex(index) {
        if (-1 === index)
            return false;
        const removed = this.items.splice(index, 1);
        if (0 === removed.length)
            return false;
        this.observable.notify(new CollectionEvent(this, CollectionEventType.Remove, removed[0], index));
        return true;
    }
    clear() {
        for (let index = this.items.length - 1; index > -1; index--) {
            this.removeIndex(index);
        }
    }
    get(index) {
        return this.items[index];
    }
    first() {
        return 0 < this.items.length ? Options.valueOf(this.items[0]) : Options.None;
    }
    indexOf(value) {
        return this.items.indexOf(value);
    }
    size() {
        return this.items.length;
    }
    map(fn) {
        const arr = [];
        for (let i = 0; i < this.items.length; i++) {
            arr[i] = fn(this.items[i], i, this.items);
        }
        return arr;
    }
    forEach(fn) {
        for (let i = 0; i < this.items.length; i++) {
            fn(this.items[i], i);
        }
    }
    move(fromIndex, toIndex) {
        if (fromIndex === toIndex)
            return;
        console.assert(0 <= toIndex && toIndex < this.size());
        console.assert(0 <= fromIndex && fromIndex < this.size());
        this.items.splice(toIndex, 0, this.items.splice(fromIndex, 1)[0]);
        this.observable.notify(new CollectionEvent(this, CollectionEventType.Order));
    }
    reduce(fn, initialValue) {
        let value = initialValue;
        for (let i = 0; i < this.items.length; i++) {
            value = fn(value, this.items[i], i);
        }
        return value;
    }
    addObserver(observer, notify = false) {
        if (notify)
            this.forEach((item, index) => observer(new CollectionEvent(this, CollectionEventType.Add, item, index)));
        return this.observable.addObserver(observer);
    }
    removeObserver(observer) {
        return this.observable.removeObserver(observer);
    }
    terminate() {
        this.observable.terminate();
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
export class NumericStepper {
    constructor(step = 1) {
        this.step = step;
    }
    decrease(value) {
        value.set(Math.round((value.get() - this.step) / this.step) * this.step);
    }
    increase(value) {
        value.set(Math.round((value.get() + this.step) / this.step) * this.step);
    }
}
NumericStepper.Integer = new NumericStepper(1);
NumericStepper.Hundredth = new NumericStepper(0.01);
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
export const readBinary = (url) => {
    return new Promise((resolve, reject) => {
        const r = new XMLHttpRequest();
        r.open("GET", url, true);
        r.responseType = "arraybuffer";
        r.onload = ignore => resolve(r.response);
        r.onerror = event => reject(event);
        r.send(null);
    });
};
export const readAudio = (context, url) => {
    return readBinary(url).then(buffer => decodeAudioData(context, buffer));
};
export const decodeAudioData = (context, buffer) => {
    return context.decodeAudioData(buffer);
};
const plural = (count, name) => {
    return `${count} ${1 < count ? `${name}s` : name}`;
};
export const timeToString = (seconds) => {
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1)
        return plural(interval, "year");
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1)
        return plural(interval, "month");
    interval = Math.floor(seconds / 86400);
    if (interval >= 1)
        return plural(interval, "day");
    interval = Math.floor(seconds / 3600);
    if (interval >= 1)
        return plural(interval, "hour");
    interval = Math.floor(seconds / 60);
    if (interval >= 1)
        return plural(interval, "minute");
    return plural(Math.ceil(seconds), "second");
};
export class Estimation {
    constructor() {
        this.lastPercent = 0.0;
        this.startTime = performance.now();
    }
    update(progress) {
        const percent = Math.floor(progress * 10000.0);
        if (this.lastPercent !== percent) {
            const computationTime = (performance.now() - this.startTime) / 1000.0;
            const remaining = (computationTime / progress) - computationTime;
            this.lastPercent = percent;
            return `${(percent / 100.0).toFixed(2)}%・${timeToString(remaining | 0)} remaining`;
        }
    }
}
export const EmptyIterator = new class {
    hasNext() {
        return false;
    }
    next() {
        return null;
    }
};
export class GeneratorIterator {
    constructor(generator) {
        this.generator = generator;
        this.curr = null;
        this.curr = generator.next();
    }
    static wrap(generator) {
        return new GeneratorIterator(generator);
    }
    hasNext() {
        return null !== this.curr && !this.curr.done;
    }
    next() {
        if (this.hasNext()) {
            const value = this.curr.value;
            this.curr = this.generator.next();
            return value;
        }
        return null;
    }
}
export class ArrayUtils {
    static fill(n, factory) {
        const array = [];
        for (let i = 0; i < n; i++) {
            array[i] = factory(i);
        }
        return array;
    }
    static shuffle(array, n, random) {
        for (let i = 0; i < n; i++) {
            const element = array[i];
            const randomIndex = random.nextInt(0, n - 1);
            array[i] = array[randomIndex];
            array[randomIndex] = element;
        }
    }
    constructor() {
    }
}
export class Settings {
    constructor() {
        this.terminator = new Terminator();
        this.observable = new ObservableImpl();
    }
    pack(data) {
        return {
            class: this.constructor.name,
            data: data
        };
    }
    unpack(format) {
        console.assert(this.constructor.name === format.class);
        return format.data;
    }
    bindValue(property) {
        this.terminator.with(property.addObserver(() => this.observable.notify(this), false));
        return this.terminator.with(property);
    }
    addObserver(observer) {
        return this.observable.addObserver(observer);
    }
    removeObserver(observer) {
        return this.observable.removeObserver(observer);
    }
    terminate() {
        this.terminator.terminate();
    }
}
//# sourceMappingURL=common.js.map