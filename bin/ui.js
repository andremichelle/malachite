import { Options, TerminableVoid } from "./lib/common.js";
class Events {
}
Events.preventDefault = event => event.preventDefault();
class MalachiteUIElement {
    constructor() {
        this.parameterSubscription = TerminableVoid.Instance;
        this.parameter = Options.None;
    }
    with(parameter) {
        this.parameterSubscription.terminate();
        this.parameterSubscription = parameter.addObserver(() => this.onChanged(parameter), true);
        this.parameter = Options.valueOf(parameter);
        return this;
    }
    terminate() {
        this.parameterSubscription.terminate();
        this.parameterSubscription = TerminableVoid.Instance;
    }
    hasParameter() {
        return this.parameter.nonEmpty();
    }
    getUnipolar() {
        if (this.parameter.isEmpty()) {
            throw new Error("No parameter present");
        }
        return this.parameter.get().getUnipolar();
    }
    ifParameter(callback) {
        this.parameter.ifPresent(callback);
    }
}
export class MalachiteSwitch extends MalachiteUIElement {
    constructor(element) {
        super();
        this.element = element;
        this.inputElement = this.element.querySelector("input[type='checkbox']");
        this.click = (event) => {
            event.preventDefault();
            this.ifParameter(parameter => parameter.setUnipolar(parameter.getUnipolar() < 0.5 ? 1.0 : 0.0));
        };
        this.installMouseInteraction();
    }
    terminate() {
        this.element.removeEventListener("click", this.click);
    }
    onChanged(parameter) {
        this.inputElement.checked = parameter.getUnipolar() >= 0.5;
    }
    installMouseInteraction() {
        this.element.addEventListener("click", this.click);
    }
}
export class MalachiteKnob extends MalachiteUIElement {
    constructor(element) {
        super();
        this.element = element;
        this.filmstrip = this.element.querySelector("img.filmstrip");
        this.textField = this.element.querySelector("input[type='text']");
        this.position = NaN;
        this.unipolar = NaN;
        this.mouseUp = () => {
            this.position = NaN;
            this.unipolar = NaN;
            window.removeEventListener("mousemove", this.mouseMove);
        };
        this.mouseMove = (event) => {
            const delta = (this.position - event.clientY) * 0.004;
            this.ifParameter(parameter => parameter.setUnipolar(Math.max(0.0, Math.min(1.0, this.unipolar + delta))));
        };
        this.mouseDown = (event) => {
            if (!this.hasParameter())
                return;
            this.position = event.clientY;
            this.unipolar = this.getUnipolar();
            window.addEventListener("mousemove", this.mouseMove);
            window.addEventListener("mouseup", this.mouseUp, { once: true });
        };
        this.installMouseInteraction();
    }
    onChanged(parameter) {
        this.setValue(parameter.getUnipolar());
        this.textField.value = parameter.print();
    }
    terminate() {
        super.terminate();
        this.element.removeEventListener("mousedown", this.mouseDown);
        this.element.removeEventListener("dragstart", Events.preventDefault);
    }
    setValue(value) {
        this.filmstrip.style.setProperty("--frame", `${(Math.round(value * 127))}`);
    }
    installMouseInteraction() {
        this.element.addEventListener("mousedown", this.mouseDown);
        this.element.addEventListener("dragstart", Events.preventDefault);
    }
}
//# sourceMappingURL=ui.js.map