import { Bits, Random } from "./math.js";
import { Range, ValueMapping } from "./mapping.js";
export declare type NoArgType<T> = {
    new (): T;
};
export interface Terminable {
    terminate(): void;
}
export declare class TerminableVoid implements Terminable {
    static Instance: TerminableVoid;
    terminate(): void;
}
export declare class Terminator implements Terminable {
    private readonly terminables;
    with<T extends Terminable>(terminable: T): T;
    terminate(): void;
}
export declare class Boot implements Observable<Boot> {
    private readonly observable;
    private readonly completion;
    private finishedTasks;
    private totalTasks;
    private completed;
    addObserver(observer: Observer<Boot>): Terminable;
    removeObserver(observer: Observer<Boot>): boolean;
    terminate(): void;
    registerProcess<T>(promise: Promise<T>): Promise<T>;
    isCompleted(): boolean;
    normalizedPercentage(): number;
    percentage(): number;
    waitForCompletion(): Promise<void>;
}
export interface Option<T> {
    get(): T;
    ifPresent(callback: (value: T) => void): void;
    contains(value: T): boolean;
    isEmpty(): boolean;
    nonEmpty(): boolean;
}
export declare class Options {
    static valueOf<T>(value: T): Option<T>;
    static Some: {
        new <T>(value: T): {
            readonly value: T;
            get: () => T;
            contains: (value: T) => boolean;
            ifPresent: (callback: (value: T) => void) => void;
            isEmpty: () => boolean;
            nonEmpty: () => boolean;
            toString(): string;
        };
    };
    static None: {
        get: () => never;
        contains: (_: never) => boolean;
        ifPresent: (_: (value: never) => void) => void;
        isEmpty: () => boolean;
        nonEmpty: () => boolean;
        toString(): string;
    };
}
export declare type Observer<VALUE> = (value: VALUE) => void;
export interface Observable<VALUE> extends Terminable {
    addObserver(observer: Observer<VALUE>, notify: boolean): Terminable;
    removeObserver(observer: Observer<VALUE>): boolean;
}
export declare class ObservableImpl<T> implements Observable<T> {
    private readonly observers;
    notify(value: T): void;
    addObserver(observer: Observer<T>): Terminable;
    removeObserver(observer: Observer<T>): boolean;
    terminate(): void;
}
export declare class ObservableBits implements Bits, Observable<ObservableBits>, Serializer<number[]> {
    private readonly bits;
    private readonly observable;
    constructor(numBits: number);
    addObserver(observer: Observer<ObservableBits>): Terminable;
    removeObserver(observer: Observer<ObservableBits>): boolean;
    setBit(index: number, value: boolean): boolean;
    getBit(index: number): boolean;
    randomise(random: Random, chance?: number): void;
    clear(): void;
    deserialize(format: number[]): ObservableBits;
    serialize(): number[];
    terminate(): void;
}
export interface Serializer<T> {
    serialize(): T;
    deserialize(format: T): Serializer<T>;
}
export interface Value<T> {
    set(value: T): boolean;
    get(): T;
}
export interface ObservableValue<T> extends Value<T>, Observable<T> {
}
export declare class ObservableValueVoid implements ObservableValue<any> {
    static Instance: ObservableValueVoid;
    addObserver(observer: Observer<any>): Terminable;
    get(): any;
    removeObserver(observer: Observer<any>): boolean;
    set(value: any): boolean;
    terminate(): void;
}
export declare enum CollectionEventType {
    Add = 0,
    Remove = 1,
    Order = 2
}
export declare class CollectionEvent<T> {
    readonly collection: ObservableCollection<T>;
    readonly type: CollectionEventType;
    readonly item: T;
    readonly index: number;
    constructor(collection: ObservableCollection<T>, type: CollectionEventType, item?: T, index?: number);
}
export declare class ObservableCollection<T> implements Observable<CollectionEvent<T>> {
    static observeNested<U extends Observable<U>>(collection: ObservableCollection<U>, observer: (collection: ObservableCollection<U>) => void): Terminable;
    private readonly observable;
    private readonly items;
    add(value: T, index?: number): boolean;
    addAll(values: T[]): void;
    remove(value: T): boolean;
    removeIndex(index: number): boolean;
    clear(): void;
    get(index: number): T;
    first(): Option<T>;
    indexOf(value: T): number;
    size(): number;
    map<U>(fn: (value: T, index: number, array: T[]) => U): U[];
    forEach(fn: (item: T, index: number) => void): void;
    move(fromIndex: number, toIndex: number): void;
    reduce<U>(fn: (previousValue: U, currentValue: T, currentIndex: number) => U, initialValue: U): U;
    addObserver(observer: Observer<CollectionEvent<T>>, notify?: boolean): Terminable;
    removeObserver(observer: Observer<CollectionEvent<T>>): boolean;
    terminate(): void;
}
export declare class ObservableValueImpl<T> implements ObservableValue<T> {
    private value?;
    private readonly observable;
    constructor(value?: T);
    get(): T;
    set(value: T): boolean;
    addObserver(observer: Observer<T>, notify?: boolean): Terminable;
    removeObserver(observer: Observer<T>): boolean;
    terminate(): void;
}
export declare class BoundNumericValue implements ObservableValue<number> {
    private readonly range;
    private readonly observable;
    private value;
    constructor(range?: Range, value?: number);
    get(): number;
    set(value: number): boolean;
    addObserver(observer: Observer<number>, notify?: boolean): Terminable;
    removeObserver(observer: Observer<number>): boolean;
    terminate(): void;
}
export declare class Parameter<T> implements ObservableValue<T> {
    readonly valueMapping: ValueMapping<T>;
    readonly printMapping: PrintMapping<T>;
    private value;
    private readonly observable;
    constructor(valueMapping: ValueMapping<T>, printMapping: PrintMapping<T>, value: T);
    getUnipolar(): number;
    setUnipolar(value: number): void;
    print(): string;
    get(): T;
    set(value: T): boolean;
    addObserver(observer: Observer<T>, notify?: boolean): Terminable;
    removeObserver(observer: Observer<T>): boolean;
    terminate(): void;
}
export interface Stepper {
    decrease(value: ObservableValue<number>): void;
    increase(value: ObservableValue<number>): void;
}
export declare class NumericStepper implements Stepper {
    private readonly step;
    static Integer: NumericStepper;
    static Hundredth: NumericStepper;
    constructor(step?: number);
    decrease(value: ObservableValue<number>): void;
    increase(value: ObservableValue<number>): void;
}
export declare type Parser<Y> = (text: string) => Y | null;
export declare type Printer<Y> = (value: Y) => string;
export declare class PrintMapping<Y> {
    private readonly parser;
    private readonly printer;
    private readonly preUnit;
    private readonly postUnit;
    static createBoolean(trueValue: string, falseValue: string): PrintMapping<boolean>;
    static UnipolarPercent: PrintMapping<number>;
    static RGB: PrintMapping<number>;
    static integer(postUnit: string): PrintMapping<number>;
    static float(numPrecision: number, preUnit: string, postUnit: string): PrintMapping<number>;
    static smallFloat(numPrecision: number, postUnit: string): PrintMapping<number>;
    constructor(parser: Parser<Y>, printer: Printer<Y>, preUnit?: string, postUnit?: string);
    parse(text: string): Y | null;
    print(value: Y): string;
}
export declare const binarySearch: (values: Float32Array, key: number) => number;
export declare const readBinary: (url: string) => Promise<ArrayBuffer>;
export declare const readAudio: (context: BaseAudioContext, url: string) => Promise<AudioBuffer>;
export declare const decodeAudioData: (context: BaseAudioContext, buffer: ArrayBuffer) => Promise<AudioBuffer>;
export declare const timeToString: (seconds: number) => string;
export declare class Estimation {
    private lastPercent;
    private startTime;
    update(progress: number): string;
}
export interface Iterator<T> {
    hasNext(): boolean;
    next(): T;
}
export declare const EmptyIterator: {
    hasNext(): boolean;
    next(): any;
};
export declare class GeneratorIterator<T> {
    private readonly generator;
    static wrap<T>(generator: Generator<T, void, T>): Iterator<T>;
    private curr;
    constructor(generator: Generator<T>);
    hasNext(): boolean;
    next(): T;
}
export declare class ArrayUtils {
    static fill<T>(n: number, factory: (index: number) => T): T[];
    static shuffle(array: ArrayBufferLike, n: number, random: Random): void;
    private constructor();
}
export interface SettingsFormat<DATA> {
    class: string;
    data: DATA;
}
export declare abstract class Settings<DATA> implements Observable<Settings<DATA>>, Serializer<SettingsFormat<DATA>>, Terminable {
    protected readonly terminator: Terminator;
    protected readonly observable: ObservableImpl<Settings<DATA>>;
    abstract deserialize(format: SettingsFormat<DATA>): Settings<DATA>;
    abstract serialize(): SettingsFormat<DATA>;
    protected pack(data?: DATA): SettingsFormat<DATA>;
    protected unpack(format: SettingsFormat<DATA>): DATA;
    protected bindValue<T>(property: ObservableValue<T>): ObservableValue<T>;
    addObserver(observer: Observer<Settings<DATA>>): Terminable;
    removeObserver(observer: Observer<Settings<DATA>>): boolean;
    terminate(): void;
}
