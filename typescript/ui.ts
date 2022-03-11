import {Option, Options, Parameter, Terminable, TerminableVoid, Terminator} from "./lib/common.js"
import {ValueMapping} from "./lib/mapping.js"

export class Events {
    static preventDefault = event => event.preventDefault()

    static async toPromise<E extends Event>(target: EventTarget, type: string): Promise<E> {
        return new Promise<E>(resolve => target
            .addEventListener(type, (event: E) => resolve(event), {once: true}))
    }

    static bindEventListener(target: EventTarget,
                             type: string, listener: EventListenerOrEventListenerObject,
                             options?: AddEventListenerOptions): Terminable {
        target.addEventListener(type, listener, options)
        return {terminate: () => target.removeEventListener(type, listener, options)}
    }
}

abstract class MalachiteUIElement implements Terminable {
    private parameterSubscription: Terminable = TerminableVoid.Instance
    private parameter: Option<Parameter<any>> = Options.None

    with(parameter: Parameter<any>): this {
        this.parameterSubscription.terminate()
        this.parameterSubscription = parameter.addObserver(() => this.onChanged(parameter), true)
        this.parameter = Options.valueOf(parameter)
        return this
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
    private readonly terminator = new Terminator()
    private readonly filmstrip: HTMLImageElement = this.element.querySelector("img.filmstrip")
    private readonly textField: HTMLInputElement = this.element.querySelector("input[type='text']")

    private position: number = NaN
    private unipolar: number = NaN

    constructor(private readonly element: Element) {
        super()
        this.installInteraction()
    }

    protected onChanged(parameter: Parameter<any>) {
        this.filmstrip.style.setProperty("--frame", `${(Math.round(parameter.getUnipolar() * 127))}`)
        this.textField.value = parameter.print()
    }

    terminate(): void {
        super.terminate()
        this.terminator.terminate()
        this.element.removeEventListener("mousedown", this.mouseDown)
        this.element.removeEventListener("dragstart", Events.preventDefault)
    }

    private mouseUp = () => {
        this.position = NaN
        this.unipolar = NaN
        window.removeEventListener("mousemove", this.mouseMove)
    }

    private mouseMove = (event: MouseEvent) => {
        const delta = (this.position - event.clientY) * 0.004
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

    private installInteraction() {
        this.element.addEventListener("mousedown", this.mouseDown)
        this.element.addEventListener("dragstart", Events.preventDefault)

        this.terminator.with(Events.bindEventListener(this.textField, "focusin", (focusEvent: FocusEvent) => {
            const blur = (() => {
                const lastFocus: HTMLElement = focusEvent.relatedTarget as HTMLElement
                return () => {
                    this.textField.setSelectionRange(0, 0)
                    if (lastFocus === null) {
                        this.textField.blur()
                    } else {
                        lastFocus.focus()
                    }
                }
            })()
            const keyboardListener = (event: KeyboardEvent) => {
                switch (event.key) {
                    case "Escape": {
                        event.preventDefault()
                        this.ifParameter(parameter => this.onChanged(parameter))
                        blur()
                        break
                    }
                    case "Enter": {
                        event.preventDefault()
                        this.ifParameter(parameter => {
                            const number = parameter.printMapping.parse(this.textField.value)
                            if (null === number || !parameter.set(number)) {
                                this.onChanged(parameter)
                            }
                        })
                        blur()
                        break
                    }
                }
            }
            this.textField.addEventListener("focusout", () => {
                this.ifParameter(parameter => this.onChanged(parameter))
                this.textField.removeEventListener("keydown", keyboardListener)
            }, {once: true})
            this.textField.addEventListener("keydown", keyboardListener)
            window.addEventListener("mouseup", () => {
                if (this.textField.selectionStart === this.textField.selectionEnd) this.textField.select()
            }, {once: true})
        }))
    }
}

export class MalachiteMeter {
    constructor(private readonly element: HTMLDivElement) {
    }

    setValue(value: number): void {
        this.element.style.setProperty("--value", value.toFixed(2))
    }
}

export class MalachiteScreen {
    readonly context: CanvasRenderingContext2D = this.canvas.getContext("2d")

    constructor(readonly canvas: HTMLCanvasElement,
                readonly xAxis: ValueMapping<number>,
                readonly yAxis: ValueMapping<number>) {
        this.canvas.width = this.canvas.clientWidth
        this.canvas.height = this.canvas.clientHeight
    }

    clear(): void {
        this.context.clearRect(0, 0, this.width(), this.height())
    }

    width(): number {
        return this.canvas.clientWidth
    }

    height(): number {
        return this.canvas.clientHeight
    }

    xToUnit(x: number): number {
        return this.xAxis.y(x / this.width())
    }

    unitToX(value: number): number {
        return this.xAxis.x(value) * this.width()
    }

    yToUnit(y: number): number {
        return this.yAxis.y(y / this.height())
    }

    unitToY(value: number): number {
        return this.yAxis.x(value) * this.height()
    }
}