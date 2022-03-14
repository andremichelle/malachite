import { ValueMapping } from "./mapping.js";
export declare const dbToGain: (db: number) => number;
export declare const gainToDb: (gain: number) => number;
export declare const SILENCE_GAIN: number;
export declare const preloadImagesOfCssFile: (path: string) => Promise<void>;
export declare const cosine: (y1: number, y2: number, mu: number) => number;
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
export declare class ArrayUtils {
    static fill<T>(n: number, factory: (index: number) => T): T[];
    private constructor();
}
