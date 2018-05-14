declare module 'tap' {

  class Deferred {
    resolve: () => void;
    reject: () => void;
  }

  function test(name: string, cb?: (t: t) => void, deferred?: Deferred): void;
  function test(name: string, cb?: (t: t) => Promise<void>, deferred?: Deferred): void;

  let jobs: number;

  export default class t {
    constructor(options?: any);
    contains: (a: any, b: any) => void;
    end: () => void;
    equal: (a: any, b: any, comment?: string) => void;
    fail: (message: string, extra?: any) => void;
    notMatch: (a: any, b: any) => void;
    notOk: (f: any, comment?: string) => void;
    ok: (f: any, comment?: string) => void;
    rejects: (f: any, r: any) => void;
    resolves: (f: any) => void;
    test: (name: string, cb?: (t: t) => Promise<void>, deferred?: Deferred) => void;
    throws: (f: any, r: any) => void;

    tearDown: () => void;
    setTimeout: (n: number) => void;
    endAll: () => void;
    threw: (er: Error, extra: Error, proxy: any) => void;
    pragma: (set: any) => void;
    plan: (n: number, comment?: string) => void;
    loop: (self: t, arr: t[], cb: () => void, i: number) => void;
    next: (er: Error) => void;
    current: () => void;
    stdin: (name: string, extra: any, deferred: Deferred) => void;
    spawn: (cmd: string, args: string, options: any, name: string, extra: any, deferred: Deferred) => void;
    done: (implicit: boolean) => void;
    autoend: () => void;
    printResult: (ok: boolean, message: string, extra: any) => void;
    writeDiags: (extra: any) => void;
    passing: () => void;
    pass: (message: string, extra: any) => void;
    addAssert: (name: string, length: number, fn: () => void) => void;
    comment: () => void;
    push: (chunk: any, encoding?: string) => void;
    bailout: (message: string) => void;
    beforeEach: (fn: () => void) => void;
    afterEach: (fn: () => void) => void;
  }

}
