import {Option, Options, Parameter, Terminable, TerminableVoid} from "./lib/common.js"

class Events {
    static preventDefault = event => event.preventDefault()
}

abstract class MalachiteUIElement implements Terminable {
    private parameterSubscription: Terminable = TerminableVoid.Instance
    private parameter: Option<Parameter<any>> = Options.None

    with(parameter: Parameter<any>): void {
        this.parameterSubscription.terminate()
        this.parameterSubscription = parameter.addObserver(() => this.onChanged(parameter), true)
        this.parameter = Options.valueOf(parameter)
    }

    terminate(): void {
        this.parameterSubscription.terminate()
        this.parameterSubscription = TerminableVoid.Instance
    }

    protected hasParameter(): boolean {
        return this.parameter.nonEmpty()
    }

    protected getUnipolar(): number {
        if (this.parameter.isEmpty()) {
            throw new Error("No parameter present")
        }
        return this.parameter.get().getUnipolar()
    }

    protected ifParameter(callback: (value: Parameter<any>) => void): void {
        this.parameter.ifPresent(callback)
    }

    protected abstract onChanged(parameter: Parameter<any>)
}

export class MalachiteSwitch extends MalachiteUIElement {
    private readonly inputElement: HTMLInputElement = this.element.querySelector("input[type='checkbox']")

    constructor(private readonly element: Element) {
        super()
        this.installMouseInteraction()
    }

    terminate(): void {
        this.element.removeEventListener("click", this.click)
    }

    protected onChanged(parameter: Parameter<any>) {
        this.inputElement.checked = parameter.getUnipolar() >= 0.5
    }

    private click = (event: Event): void => {
        event.preventDefault()
        this.ifParameter(parameter => parameter.setUnipolar(parameter.getUnipolar() < 0.5 ? 1.0 : 0.0))
    }

    private installMouseInteraction(): void {
        this.element.addEventListener("click", this.click)
    }
}

export class MalachiteKnob extends MalachiteUIElement {
    private readonly filmstrip: HTMLImageElement = this.element.querySelector("img.filmstrip")
    private readonly textField: HTMLInputElement = this.element.querySelector("input[type='text']")

    private position: number = NaN
    private unipolar: number = NaN

    constructor(private readonly element: Element) {
        super()
        this.installMouseInteraction()
    }

    protected onChanged(parameter: Parameter<any>) {
        this.setValue(parameter.getUnipolar())
        this.textField.value = parameter.print()
    }

    terminate(): void {
        super.terminate()
        this.element.removeEventListener("mousedown", this.mouseDown)
        this.element.removeEventListener("dragstart", Events.preventDefault)
    }

    private setValue(value: number): void {
        this.filmstrip.style.setProperty("--frame", `${(Math.round(value * 127))}`)
    }

    private mouseUp = () => {
        this.position = NaN
        this.unipolar = NaN
        window.removeEventListener("mousemove", this.mouseMove)
    }

    private mouseMove = (event: MouseEvent) => {
        const delta = (this.position - event.clientY) * 0.002
        this.ifParameter(parameter =>
            parameter.setUnipolar(Math.max(0.0, Math.min(1.0, this.unipolar + delta))))
    }

    private mouseDown = (event: MouseEvent) => {
        if (!this.hasParameter()) return
        this.position = event.clientY
        this.unipolar = this.getUnipolar()
        window.addEventListener("mousemove", this.mouseMove)
        window.addEventListener("mouseup", this.mouseUp, {once: true})
    }

    private installMouseInteraction() {
        this.element.addEventListener("mousedown", this.mouseDown)
        this.element.addEventListener("dragstart", Events.preventDefault)
    }
}