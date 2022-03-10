declare class RMS {
    private readonly n;
    private readonly values;
    private readonly inv;
    private sum;
    private index;
    constructor(n: number);
    pushPop(squared: number): number;
}
declare class ArrayUtils {
    static fill<T>(n: number, factory: (index: number) => T): T[];
    private constructor();
}
declare const RENDER_QUANTUM: number;
