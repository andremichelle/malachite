import {Linear, Range, ValueMapping} from "./mapping.js"

export const cosine = (y1: number, y2: number, mu: number): number => {
    const mu2 = (1.0 - Math.cos(mu * Math.PI)) * 0.5
    return y1 * (1.0 - mu2) + y2 * mu2
}

export interface Terminable {
    terminate(): void
}

export class TerminableVoid implements Terminable {
    static Instance = new TerminableVoid()

    terminate(): void {
    }
}

export class Terminator implements Terminable {
    private readonly terminables: Terminable[] = []

    with<T extends Terminable>(terminable: T): T {
        this.terminables.push(terminable)
        return terminable
    }

    terminate(): void {
        while (this.terminables.length) {
            this.terminables.pop().terminate()
        }
    }
}

export interface Option<T> {
    get(): T

    ifPresent(callback: (value: T) => void): void

    contains(value: T): boolean

    isEmpty(): boolean

    nonEmpty(): boolean
}

export class Options {
    static valueOf<T>(value: T): Option<T> {
        return null === value || undefined === value ? Options.None : new Options.Some(value)
    }

    static Some = class<T> implements Option<T> {
        constructor(readonly value: T) {
            console.assert(null !== value && undefined !== value, "Cannot be null or undefined")
        }

        get = (): T => this.value
        contains = (value: T): boolean => value === this.value
        ifPresent = (callback: (value: T) => void): void => callback(this.value)
        isEmpty = (): boolean => false
        nonEmpty = (): boolean => true

        toString(): string {
            return `Options.Some(${this.value})`
        }
    }

    static None = new class implements Option<never> {
        get = (): never => {
            throw new Error("Option has no value")
        }
        contains = (_: never): boolean => false
        ifPresent = (_: (value: never) => void): void => {
        }
        isEmpty = (): boolean => true
        nonEmpty = (): boolean => false

        toString(): string {
            return `Options.None`
        }
    }
}

export type Observer<VALUE> = (value: VALUE) => void

export interface Observable<VALUE> extends Terminable {
    addObserver(observer: Observer<VALUE>, notify: boolean): Terminable

    removeObserver(observer: Observer<VALUE>): boolean
}

export class ObservableImpl<T> implements Observable<T> {
    private readonly observers: Observer<T>[] = []

    notify(value: T) {
        this.observers.forEach(observer => observer(value))
    }

    addObserver(observer: Observer<T>): Terminable {
        this.observers.push(observer)
        return {terminate: () => this.removeObserver(observer)}
    }

    removeObserver(observer: Observer<T>): boolean {
        let index = this.observers.indexOf(observer)
        if (-1 < index) {
            this.observers.splice(index, 1)
            return true
        }
        return false
    }

    terminate(): void {
        this.observers.splice(0, this.observers.length)
    }
}

export interface Serializer<T> {
    serialize(): T

    deserialize(format: T): Serializer<T>
}

export interface Value<T> {
    set(value: T): boolean

    get(): T
}

export interface ObservableValue<T> extends Value<T>, Observable<T> {
}

export class ObservableValueImpl<T> implements ObservableValue<T> {
    private readonly observable = new ObservableImpl<T>()

    constructor(private value?: T) {
    }

    get(): T {
        return this.value
    }

    set(value: T): boolean {
        if (this.value === value) {
            return false
        }
        this.value = value
        this.observable.notify(value)
        return true
    }

    addObserver(observer: Observer<T>, notify: boolean = false): Terminable {
        if (notify) observer(this.value)
        return this.observable.addObserver(observer)
    }

    removeObserver(observer: Observer<T>): boolean {
        return this.observable.removeObserver(observer)
    }

    terminate(): void {
        this.observable.terminate()
    }
}

export class BoundNumericValue implements ObservableValue<number> {
    private readonly observable = new ObservableImpl<number>()
    private value: number

    constructor(private readonly range: Range = Linear.Identity,
                value: number = 0.0) {
        this.set(value)
    }

    get(): number {
        return this.value
    }

    set(value: number): boolean {
        value = this.range.clamp(value)
        if (this.value === value) {
            return false
        }
        this.value = value
        this.observable.notify(value)
        return true
    }

    addObserver(observer: Observer<number>, notify: boolean = false): Terminable {
        if (notify) observer(this.value)
        return this.observable.addObserver(observer)
    }

    removeObserver(observer: Observer<number>): boolean {
        return this.observable.removeObserver(observer)
    }

    terminate(): void {
        this.observable.terminate()
    }
}

export class Parameter<T> implements ObservableValue<T> {
    private readonly observable = new ObservableImpl<T>()

    constructor(readonly valueMapping: ValueMapping<T>,
                readonly printMapping: PrintMapping<T>,
                private value: T) {
    }

    getUnipolar(): number {
        return this.valueMapping.x(this.value)
    }

    setUnipolar(value: number): void {
        this.set(this.valueMapping.y(value))
    }

    print(): string {
        return this.printMapping.print(this.value)
    }

    get(): T {
        return this.value
    }

    set(value: T): boolean {
        if (value === this.value) {
            return
        }
        this.value = value
        this.observable.notify(value)
        return true
    }

    addObserver(observer: Observer<T>, notify: boolean = false): Terminable {
        if (notify) observer(this.value)
        return this.observable.addObserver(observer)
    }

    removeObserver(observer: Observer<T>): boolean {
        return this.observable.removeObserver(observer)
    }

    terminate(): void {
        this.observable.terminate()
    }
}

export type Parser<Y> = (text: string) => Y | null
export type Printer<Y> = (value: Y) => string

export class PrintMapping<Y> {
    static createBoolean(trueValue: string, falseValue: string) {
        return new PrintMapping(text => {
            return trueValue.toLowerCase() === text.toLowerCase()
        }, value => value ? trueValue : falseValue)
    }

    static UnipolarPercent = new PrintMapping(text => {
        const value = parseFloat(text)
        if (isNaN(value)) return null
        return value / 100.0
    }, value => (value * 100.0).toFixed(1), "", "%")
    static RGB = new PrintMapping<number>(text => {
        if (3 === text.length) {
            text = text.charAt(0) + text.charAt(0) + text.charAt(1) + text.charAt(1) + text.charAt(2) + text.charAt(2)
        }
        if (6 === text.length) {
            return parseInt(text, 16)
        } else {
            return null
        }
    }, value => value.toString(16).padStart(6, "0").toUpperCase(), "#", "")

    static integer(postUnit: string): PrintMapping<number> {
        return new PrintMapping(text => {
            const value = parseInt(text, 10)
            if (isNaN(value)) return null
            return Math.round(value) | 0
        }, value => String(value), "", postUnit)
    }

    static float(numPrecision: number, preUnit: string, postUnit: string): PrintMapping<number> {
        return new PrintMapping(text => {
            const value = parseFloat(text)
            if (isNaN(value)) return null
            return value
        }, value => {
            if (isNaN(value)) {
                return "N/A"
            }
            if (!isFinite(value)) {
                return value < 0.0 ? "-∞" : "∞"
            }
            return value.toFixed(numPrecision)
        }, preUnit, postUnit)
    }

    static smallFloat(numPrecision: number, postUnit: string): PrintMapping<number> {
        return new PrintMapping(text => {
            const value = parseFloat(text)
            if (isNaN(value)) return null
            return text.toLowerCase().includes("k") ? value * 1000.0 : value
        }, value => {
            if (value >= 1000.0) {
                return `${(value / 1000.0).toFixed(numPrecision)}k`
            }
            return value.toFixed(numPrecision)
        }, "", postUnit)
    }

    constructor(private readonly parser: Parser<Y>,
                private readonly printer: Printer<Y>,
                private readonly preUnit = "",
                private readonly postUnit = "") {
    }

    parse(text: string): Y | null {
        return this.parser(text.replace(this.preUnit, "").replace(this.postUnit, ""))
    }

    print(value: Y): string {
        return undefined === value ? "" : `${this.preUnit}${this.printer(value)}${this.postUnit}`
    }
}

export const binarySearch = (values: Float32Array, key: number): number => {
    let low = 0 | 0
    let high = (values.length - 1) | 0
    while (low <= high) {
        const mid = (low + high) >>> 1
        const midVal = values[mid]
        if (midVal < key)
            low = mid + 1
        else if (midVal > key)
            high = mid - 1
        else {
            if (midVal === key)
                return mid
            else if (midVal < key)
                low = mid + 1
            else
                high = mid - 1
        }
    }
    return high
}

export class ArrayUtils {
    static fill<T>(n: number, factory: (index: number) => T): T[] {
        const array: T[] = []
        for (let i = 0; i < n; i++) {
            array[i] = factory(i)
        }
        return array
    }

    // noinspection JSUnusedLocalSymbols
    private constructor() {
    }
}