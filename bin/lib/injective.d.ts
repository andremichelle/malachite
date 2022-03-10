import { Settings, SettingsFormat } from "./common.js";
import { Random } from "./math.js";
export declare type InjectiveData = PowData | CShapeData | TShapeData | SmoothStepData | MonoNoiseData;
export declare type InjectiveType = {
    new (): Injective<any>;
};
export declare abstract class Injective<DATA extends InjectiveData> extends Settings<DATA> {
    static from(format: SettingsFormat<any>): Injective<any>;
    static random(random: Random): Injective<any>;
    fxi(x: number): number;
    fyi(y: number): number;
    abstract fx(x: number): number;
    abstract fy(y: number): number;
    abstract copy(): Injective<DATA>;
    abstract randomize(random: Random): Injective<DATA>;
}
export declare class IdentityInjective extends Injective<never> {
    fx(x: number): number;
    fy(y: number): number;
    serialize(): SettingsFormat<never>;
    deserialize(format: SettingsFormat<never>): IdentityInjective;
    copy(): IdentityInjective;
    randomize(random: Random): IdentityInjective;
}
declare interface PowData {
    exponent: number;
}
export declare class PowInjective extends Injective<PowData> {
    private readonly range;
    readonly exponent: any;
    fx(x: number): number;
    fy(y: number): number;
    serialize(): SettingsFormat<PowData>;
    deserialize(format: SettingsFormat<PowData>): PowInjective;
    copy(): PowInjective;
    randomize(random: Random): PowInjective;
}
declare interface CShapeData {
    slope: number;
}
export declare class CShapeInjective extends Injective<CShapeData> {
    private readonly range;
    readonly slope: any;
    private o;
    private c;
    constructor();
    fx(x: number): number;
    fy(y: number): number;
    serialize(): SettingsFormat<CShapeData>;
    deserialize(format: SettingsFormat<CShapeData>): CShapeInjective;
    copy(): CShapeInjective;
    randomize(random: Random): CShapeInjective;
    private update;
}
declare interface TShapeData {
    shape: number;
}
export declare class TShapeInjective extends Injective<TShapeData> {
    private readonly range;
    readonly shape: any;
    constructor();
    fx(x: number): number;
    fy(y: number): number;
    serialize(): SettingsFormat<TShapeData>;
    deserialize(format: SettingsFormat<TShapeData>): TShapeInjective;
    copy(): TShapeInjective;
    randomize(random: Random): TShapeInjective;
}
declare interface SmoothStepData {
    edge0: number;
    edge1: number;
}
export declare class SmoothStepInjective extends Injective<SmoothStepData> {
    readonly edge0: any;
    readonly edge1: any;
    constructor();
    fx(x: number): number;
    fy(y: number): number;
    deserialize(format: SettingsFormat<SmoothStepData>): SmoothStepInjective;
    serialize(): SettingsFormat<SmoothStepData>;
    copy(): SmoothStepInjective;
    randomize(random: Random): SmoothStepInjective;
}
declare interface MonoNoiseData {
    seed: number;
    resolution: number;
    roughness: number;
    strength: number;
}
export declare class MonoNoiseInjective extends Injective<MonoNoiseData> {
    static monotoneRandom(random: Random, n: number, roughness: number, strength: number): Float32Array;
    readonly seed: any;
    readonly resolution: any;
    readonly roughness: any;
    readonly strength: any;
    private values;
    constructor();
    fx(y: number): number;
    fy(x: number): number;
    deserialize(format: SettingsFormat<MonoNoiseData>): MonoNoiseInjective;
    serialize(): SettingsFormat<MonoNoiseData>;
    copy(): MonoNoiseInjective;
    randomize(random: Random): MonoNoiseInjective;
    private update;
}
export {};
