import { Parameter, Terminable } from "./lib/common.js";
import { ValueMapping } from "./lib/mapping.js";
export declare class Events {
    static preventDefault: (event: any) => any;
    static toPromise<E extends Event>(target: EventTarget, type: string): Promise<E>;
    static bindEventListener(target: EventTarget, type: string, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions): Terminable;
}
declare abstract class MalachiteUIElement implements Terminable {
    private parameterSubscription;
    private parameter;
    with(parameter: Parameter<any>): this;
    terminate(): void;
    protected hasParameter(): boolean;
    protected getUnipolar(): number;
    protected ifParameter(callback: (value: Parameter<any>) => void): void;
    protected abstract onChanged(parameter: Parameter<any>): any;
}
export declare class MalachiteSwitch extends MalachiteUIElement {
    private readonly element;
    private readonly inputElement;
    constructor(element: Element);
    terminate(): void;
    protected onChanged(parameter: Parameter<any>): void;
    private click;
    private installMouseInteraction;
}
export declare class MalachiteKnob extends MalachiteUIElement {
    private readonly element;
    private readonly terminator;
    private readonly filmstrip;
    private readonly textField;
    constructor(element: Element);
    protected onChanged(parameter: Parameter<any>): void;
    terminate(): void;
    private installInteraction;
}
export declare class MalachiteMeter {
    private readonly element;
    constructor(element: HTMLDivElement);
    setValue(value: number): void;
}
export declare class MalachiteScreen {
    readonly canvas: HTMLCanvasElement;
    readonly xAxis: ValueMapping<number>;
    readonly yAxis: ValueMapping<number>;
    readonly context: CanvasRenderingContext2D;
    constructor(canvas: HTMLCanvasElement, xAxis: ValueMapping<number>, yAxis: ValueMapping<number>);
    clear(): void;
    width(): number;
    height(): number;
    xToUnit(x: number): number;
    unitToX(value: number): number;
    yToUnit(y: number): number;
    unitToY(value: number): number;
}
export {};
