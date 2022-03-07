import { Parameter, Terminable } from "./lib/common.js";
declare abstract class MalachiteUIElement implements Terminable {
    private parameterSubscription;
    private parameter;
    with(parameter: Parameter<any>): void;
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
    private readonly filmstrip;
    private readonly textField;
    private position;
    private unipolar;
    constructor(element: Element);
    protected onChanged(parameter: Parameter<any>): void;
    terminate(): void;
    private setValue;
    private mouseUp;
    private mouseMove;
    private mouseDown;
    private installMouseInteraction;
}
export {};
