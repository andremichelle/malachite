import {Random} from "./math.js"
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

export class Boot implements Observable<Boot> {
    private readonly observable = new ObservableImpl<Boot>()
    private readonly completion = new Promise<void>((resolve: (value: void) => void) => {
        this.observable.addObserver(boot => {
            if (boot.isCompleted()) {
                requestAnimationFrame(() => resolve())
                boot.terminate()
            }
        })
    })

    private finishedTasks: number = 0 | 0
    private totalTasks: number = 0 | 0
    private completed: boolean = false

    addObserver(observer: Observer<Boot>): Terminable {
        return this.observable.addObserver(observer)
    }

    removeObserver(observer: Observer<Boot>): boolean {
        return this.observable.removeObserver(observer)
    }

    terminate(): void {
        this.observable.terminate()
    }

    registerProcess<T>(promise: Promise<T>): Promise<T> {
        console.assert(!this.completed, "Cannot register processes when boot is already completed.")
        promise.then(() => {
            this.finishedTasks++
            if (this.isCompleted()) this.completed = true
            this.observable.notify(this)
        })
        this.totalTasks++
        return promise
    }

    isCompleted(): boolean {
        return this.finishedTasks === this.totalTasks
    }

    normalizedPercentage() {
        return this.finishedTasks / this.totalTasks
    }

    percentage() {
        return Math.round(this.normalizedPercentage() * 100.0)
    }

    waitForCompletion(): Promise<void> {
        return this.completion
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

export class ObservableValueVoid implements ObservableValue<any> {
    static Instance = new ObservableValueVoid()

    addObserver(observer: Observer<any>): Terminable {
        return TerminableVoid.Instance
    }

    get(): any {
    }

    removeObserver(observer: Observer<any>): boolean {
        return false
    }

    set(value: any): boolean {
        return true
    }

    terminate(): void {
    }
}

export enum CollectionEventType {
    Add, Remove, Order
}

// noinspection JSUnusedGlobalSymbols
export class CollectionEvent<T> {
    constructor(readonly collection: ObservableCollection<T>,
                readonly type: CollectionEventType,
                readonly item: T = null,
                readonly index: number = -1) {
    }
}

export class ObservableCollection<T> implements Observable<CollectionEvent<T>> {
    static observeNested<U extends Observable<U>>(collection: ObservableCollection<U>,
                                                  observer: (collection: ObservableCollection<U>) => void): Terminable {
        const itemObserver = _ => observer(collection)
        const observers: Map<U, Terminable> = new Map()
        collection.forEach((observable: U) => observers.set(observable, observable.addObserver(itemObserver, false)))
        collection.addObserver((event: CollectionEvent<U>) => {
            if (event.type === CollectionEventType.Add) {
                observers.set(event.item, event.item.addObserver(itemObserver, false))
            } else if (event.type === CollectionEventType.Remove) {
                const observer = observers.get(event.item)
                console.assert(observer !== undefined)
                observers.delete(event.item)
                observer.terminate()
            } else if (event.type === CollectionEventType.Order) {
                // ... nothing
            }
            observer(collection)
        })
        return {
            terminate() {
                observers.forEach((value: Terminable) => value.terminate())
                observers.clear()
            }
        }
    }


    private readonly observable = new ObservableImpl<CollectionEvent<T>>()

    private readonly items: T[] = []

    add(value: T, index: number = Number.MAX_SAFE_INTEGER): boolean {
        console.assert(0 <= index)
        index = Math.min(index, this.items.length)
        if (this.items.includes(value)) return false
        this.items.splice(index, 0, value)
        this.observable.notify(new CollectionEvent(this, CollectionEventType.Add, value, index))
        return true
    }

    addAll(values: T[]): void {
        for (const value of values) {
            this.add(value)
        }
    }

    remove(value: T): boolean {
        return this.removeIndex(this.items.indexOf(value))
    }

    removeIndex(index: number) {
        if (-1 === index) return false
        const removed: T[] = this.items.splice(index, 1)
        if (0 === removed.length) return false
        this.observable.notify(new CollectionEvent(this, CollectionEventType.Remove, removed[0], index))
        return true
    }

    clear() {
        for (let index = this.items.length - 1; index > -1; index--) {
            this.removeIndex(index)
        }
    }

    get(index: number): T {
        return this.items[index]
    }

    first(): Option<T> {
        return 0 < this.items.length ? Options.valueOf(this.items[0]) : Options.None
    }

    indexOf(value: T): number {
        return this.items.indexOf(value)
    }

    size(): number {
        return this.items.length
    }

    map<U>(fn: (value: T, index: number, array: T[]) => U): U[] {
        const arr: U[] = []
        for (let i = 0; i < this.items.length; i++) {
            arr[i] = fn(this.items[i], i, this.items)
        }
        return arr
    }

    forEach(fn: (item: T, index: number) => void): void {
        for (let i = 0; i < this.items.length; i++) {
            fn(this.items[i], i)
        }
    }

    move(fromIndex: number, toIndex: number) {
        if (fromIndex === toIndex) return
        console.assert(0 <= toIndex && toIndex < this.size())
        console.assert(0 <= fromIndex && fromIndex < this.size())
        this.items.splice(toIndex, 0, this.items.splice(fromIndex, 1)[0])
        this.observable.notify(new CollectionEvent<T>(this, CollectionEventType.Order))
    }

    reduce<U>(fn: (previousValue: U, currentValue: T, currentIndex: number) => U, initialValue: U): U {
        let value: U = initialValue
        for (let i = 0; i < this.items.length; i++) {
            value = fn(value, this.items[i], i)
        }
        return value
    }

    addObserver(observer: Observer<CollectionEvent<T>>, notify: boolean = false): Terminable {
        if (notify) this.forEach((item: T, index: number) => observer(new CollectionEvent<T>(this, CollectionEventType.Add, item, index)))
        return this.observable.addObserver(observer)
    }

    removeObserver(observer: Observer<CollectionEvent<T>>): boolean {
        return this.observable.removeObserver(observer)
    }

    terminate(): void {
        this.observable.terminate()
    }
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

export interface Stepper {
    decrease(value: ObservableValue<number>): void

    increase(value: ObservableValue<number>): void
}

export class NumericStepper implements Stepper {
    static Integer = new NumericStepper(1)
    static Hundredth = new NumericStepper(0.01)

    constructor(private readonly step: number = 1) {
    }

    decrease(value: ObservableValue<number>): void {
        value.set(Math.round((value.get() - this.step) / this.step) * this.step)
    }

    increase(value: ObservableValue<number>): void {
        value.set(Math.round((value.get() + this.step) / this.step) * this.step)
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

export const readBinary = (url: string): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
        const r = new XMLHttpRequest()
        r.open("GET", url, true)
        r.responseType = "arraybuffer"
        r.onload = ignore => resolve(r.response)
        r.onerror = event => reject(event)
        r.send(null)
    })
}
export const readAudio = (context: BaseAudioContext, url: string): Promise<AudioBuffer> => {
    return readBinary(url).then(buffer => decodeAudioData(context, buffer))
}
export const decodeAudioData = (context: BaseAudioContext, buffer: ArrayBuffer): Promise<AudioBuffer> => {
    return context.decodeAudioData(buffer)
}

const plural = (count: number, name: string): string => {
    return `${count} ${1 < count ? `${name}s` : name}`
}

export const timeToString = (seconds: number): string => {
    let interval = Math.floor(seconds / 31536000)
    if (interval >= 1) return plural(interval, "year")
    interval = Math.floor(seconds / 2592000)
    if (interval >= 1) return plural(interval, "month")
    interval = Math.floor(seconds / 86400)
    if (interval >= 1) return plural(interval, "day")
    interval = Math.floor(seconds / 3600)
    if (interval >= 1) return plural(interval, "hour")
    interval = Math.floor(seconds / 60)
    if (interval >= 1) return plural(interval, "minute")
    return plural(Math.ceil(seconds), "second")
}

export class Estimation {
    private lastPercent: number = 0.0
    private startTime: number = performance.now()

    update(progress: number): string {
        const percent = Math.floor(progress * 10000.0)
        if (this.lastPercent !== percent) {
            const computationTime = (performance.now() - this.startTime) / 1000.0
            const remaining = (computationTime / progress) - computationTime
            this.lastPercent = percent
            return `${(percent / 100.0).toFixed(2)}%・${timeToString(remaining | 0)} remaining`
        }
    }
}

export interface Iterator<T> {
    hasNext(): boolean

    next(): T
}

export const EmptyIterator = new class implements Iterator<any> {
    hasNext(): boolean {
        return false
    }

    next(): any {
        return null
    }
}

export class GeneratorIterator<T> {
    static wrap<T>(generator: Generator<T, void, T>): Iterator<T> {
        return new GeneratorIterator<T>(generator)
    }

    private curr: IteratorResult<T> = null

    constructor(private readonly generator: Generator<T>) {
        this.curr = generator.next()
    }

    hasNext(): boolean {
        return null !== this.curr && !this.curr.done
    }

    next(): T {
        if (this.hasNext()) {
            const value: T = this.curr.value
            this.curr = this.generator.next()
            return value
        }
        return null
    }
}

export class ArrayUtils {
    static fill<T>(n: number, factory: (index: number) => T): T[] {
        const array: T[] = []
        for (let i = 0; i < n; i++) {
            array[i] = factory(i)
        }
        return array
    }

    static shuffle(array: ArrayBufferLike, n: number, random: Random) {
        for (let i = 0; i < n; i++) {
            const element = array[i]
            const randomIndex = random.nextInt(0, n - 1)
            array[i] = array[randomIndex]
            array[randomIndex] = element
        }
    }

    // noinspection JSUnusedLocalSymbols
    private constructor() {
    }
}

export interface SettingsFormat<DATA> {
    class: string
    data: DATA
}

export abstract class Settings<DATA> implements Observable<Settings<DATA>>, Serializer<SettingsFormat<DATA>>, Terminable {
    protected readonly terminator: Terminator = new Terminator()
    protected readonly observable: ObservableImpl<Settings<DATA>> = new ObservableImpl<Settings<DATA>>()

    abstract deserialize(format: SettingsFormat<DATA>): Settings<DATA>

    abstract serialize(): SettingsFormat<DATA>

    protected pack(data?: DATA): SettingsFormat<DATA> {
        return {
            class: this.constructor.name,
            data: data
        }
    }

    protected unpack(format: SettingsFormat<DATA>): DATA {
        console.assert(this.constructor.name === format.class)
        return format.data
    }

    protected bindValue<T>(property: ObservableValue<T>): ObservableValue<T> {
        this.terminator.with(property.addObserver(() => this.observable.notify(this), false))
        return this.terminator.with(property)
    }

    addObserver(observer: Observer<Settings<DATA>>): Terminable {
        return this.observable.addObserver(observer)
    }

    removeObserver(observer: Observer<Settings<DATA>>): boolean {
        return this.observable.removeObserver(observer)
    }

    terminate(): void {
        this.terminator.terminate()
    }
}