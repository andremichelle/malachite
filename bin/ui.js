var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Options, TerminableVoid, Terminator } from "./lib/common.js";
export class Events {
    static toPromise(target, type) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => target
                .addEventListener(type, (event) => resolve(event), { once: true }));
        });
    }
    static bindEventListener(target, type, listener, options) {
        target.addEventListener(type, listener, options);
        return { terminate: () => target.removeEventListener(type, listener, options) };
    }
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
class MouseModifier {
    static start(startEvent, startValue, modifier, multiplier = 0.003) {
        let position = startEvent.clientY;
        let value = startValue;
        const move = (event) => {
            modifier(value + (position - event.clientY) * multiplier);
        };
        const up = () => {
            position = NaN;
            value = NaN;
            window.removeEventListener("mousemove", move);
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up, { once: true });
    }
    constructor() {
    }
}
class TouchModifier {
    static start(startEvent, startValue, modifier, multiplier = 0.003) {
        let position = startEvent.touches[0].clientY;
        let value = startValue;
        const move = (event) => {
            modifier(value + (position - event.touches[0].clientY) * multiplier);
        };
        const up = () => {
            position = NaN;
            value = NaN;
            window.removeEventListener("touchmove", move);
        };
        window.addEventListener("touchmove", move);
        window.addEventListener("touchend", up, { once: true });
    }
    constructor() {
    }
}
export class MalachiteKnob extends MalachiteUIElement {
    constructor(element) {
        super();
        this.element = element;
        this.terminator = new Terminator();
        this.filmstrip = this.element.querySelector("img.filmstrip");
        this.textField = this.element.querySelector("input[type='text']");
        this.installInteraction();
    }
    onChanged(parameter) {
        this.filmstrip.style.setProperty("--frame", `${(Math.round(parameter.getUnipolar() * 127))}`);
        this.textField.value = parameter.print();
    }
    terminate() {
        super.terminate();
        this.terminator.terminate();
        this.element.removeEventListener("dragstart", Events.preventDefault);
    }
    installInteraction() {
        const onActionStart = (event) => {
            if (!this.hasParameter())
                return;
            const startValue = this.getUnipolar();
            const modifier = value => this.ifParameter(parameter => parameter.setUnipolar(Math.max(0.0, Math.min(1.0, value))));
            if (event.type === "touchstart") {
                TouchModifier.start(event, startValue, modifier);
            }
            else if (event.type === "mousedown") {
                MouseModifier.start(event, startValue, modifier);
            }
        };
        this.element.addEventListener("mousedown", onActionStart);
        this.element.addEventListener("touchstart", onActionStart);
        this.element.addEventListener("dragstart", Events.preventDefault);
        this.terminator.with(Events.bindEventListener(this.textField, "focusin", (focusEvent) => {
            const blur = (() => {
                const lastFocus = focusEvent.relatedTarget;
                return () => {
                    this.textField.setSelectionRange(0, 0);
                    if (lastFocus === null) {
                        this.textField.blur();
                    }
                    else {
                        lastFocus.focus();
                    }
                };
            })();
            const keyboardListener = (event) => {
                switch (event.key) {
                    case "Escape": {
                        event.preventDefault();
                        this.ifParameter(parameter => this.onChanged(parameter));
                        blur();
                        break;
                    }
                    case "Enter": {
                        event.preventDefault();
                        this.ifParameter(parameter => {
                            const number = parameter.printMapping.parse(this.textField.value);
                            if (null === number || !parameter.set(number)) {
                                this.onChanged(parameter);
                            }
                        });
                        blur();
                        break;
                    }
                }
            };
            this.textField.addEventListener("focusout", () => {
                this.ifParameter(parameter => this.onChanged(parameter));
                this.textField.removeEventListener("keydown", keyboardListener);
            }, { once: true });
            this.textField.addEventListener("keydown", keyboardListener);
            window.addEventListener("mouseup", () => {
                if (this.textField.selectionStart === this.textField.selectionEnd)
                    this.textField.select();
            }, { once: true });
        }));
    }
}
export class MalachiteMeter {
    constructor(element) {
        this.element = element;
    }
    setValue(value) {
        this.element.style.setProperty("--value", value.toFixed(2));
    }
}
export class MalachiteScreen {
    constructor(canvas, xAxis, yAxis) {
        this.canvas = canvas;
        this.xAxis = xAxis;
        this.yAxis = yAxis;
        this.context = this.canvas.getContext("2d");
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }
    clear() {
        this.context.clearRect(0, 0, this.width(), this.height());
    }
    width() {
        return this.canvas.clientWidth;
    }
    height() {
        return this.canvas.clientHeight;
    }
    xToUnit(x) {
        return this.xAxis.y(x / this.width());
    }
    unitToX(value) {
        return this.xAxis.x(value) * this.width();
    }
    yToUnit(y) {
        return this.yAxis.y(y / this.height());
    }
    unitToY(value) {
        return this.yAxis.x(value) * this.height();
    }
}
//# sourceMappingURL=ui.js.map