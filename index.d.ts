import EventEmitter from 'events';
import { PassThrough, Writable } from 'stream';

type EventsType = {
  PASSED: 'passed';
  FAILED: 'failed';
  SKIPPED: 'skipped';
  STARTED: 'started';
  FINISHED: 'finished';
}

type zUnitOptions = Partial<{
  defaults: unknown;
  initial: unknown;
  runtime: unknown;
  bequeathed: unknown;
}>;

declare class Runnable extends EventEmitter.EventEmitter {
  constructor(name: string);

  name: string;

  description: string;
}

type zUnitSyntax = {
  describe: typeof describe;
  xdescribe: typeof xdescribe;
  odescribe: typeof odescribe;
  it: typeof it;
  xit: typeof xit;
  oit: typeof oit;
  before: typeof before;
  beforeEach: typeof beforeEach;
  after: typeof after;
  afterEach: typeof afterEach;
  include: typeof include;
}

type OutcomesType = {
  PASSED: 'passed';
  FAILED: 'failed';
  SKIPPED: 'skipped';
}

export const Events: EventsType;

export class Harness extends EventEmitter.EventEmitter {
  constructor(testable: Testable, initial?: zUnitOptions);

  numberOfTests: number;

  report: unknown;

  run(reporter: unknown, runtime?: zUnitOptions): Promise<unknown>;
}

export class Hook extends Runnable {
  constructor(name: string, fn: Function, initial?: zUnitOptions);

  name: string;

  run(propogatedOptions: zUnitOptions): Promise<void>;
}

export class HookSet {
  addBefores(...additions: unknown[]): this;

  addAfters(...additions: unknown[]): this;

  runBefores(options: zUnitOptions): Promise<void>;

  runAfters(options: zUnitOptions): Promise<void>;
}

export class Options {
  constructor(options?: zUnitOptions);

  defaults: unknown;

  initial: unknown;

  runtime: unknown;

  bequeathed: unknown;

  get(name: string): unknown;

  export(): zUnitOptions;

  apply(other: zUnitOptions): this;

  bequeath(options: zUnitOptions): void;
}

export const Outcomes: OutcomesType;

export class Suite extends Testable {
  constructor(name: string, initial?: zUnitOptions);

  pending: boolean;

  numberOfTests: number;

  numberOfPasses: number;

  numberOfFailures: number;

  numberOfSkipped: number;

  discover(runtime?: Partial<{
    directory: string;
    pattern: RegExp;
    filter: () => boolean;
  }>): Testable;

  hasExclusiveTests(): boolean;

  hasFailures(): boolean;

  before(...additions: unknown[]): this;

  beforeEach(...additions: unknown[]): this;

  after(...additions: unknown[]): this;

  afterEach(...additions: unknown[]): this;

  add(...additions: unknown[]): this;

  run(reporter: unknown, propagatedOptions: zUnitOptions, force?: boolean): Promise<void>;
}

export class Test extends Testable {
  constructor(name: string, fn: Function, initial?: zUnitOptions)

  point: unknown;

  numberOfTests: number;

  numberOfPasses: number;

  numberOfFailures: number;

  numberOfSkipped: number;

  pending: boolean;

  hasExclusiveTests(): boolean;

  run(reporter: unknown, propagatedOptions: zUnitOptions): Promise<void>;
}

export class Testable extends Runnable {
  constructor(...args: string[]);

  passed: boolean;

  failed: boolean;

  skipped: boolean;

  reason: string;

  stats: {
    tests: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  }

  exclusive: boolean;
}

export const syntax: zUnitSyntax;

export function describe(name: string, fn: Function, options?: unknown): void;
export function xdescribe(name: string, fn: Function, options?: unknown): void;
export function odescribe(name: string, fn: Function, options?: unknown): void;
export function it(name: string, fn: Function, options?: unknown): void;
export function xit(name: string, fn: Function, options?: unknown): void;
export function oit(name: string, fn: Function, options?: unknown): void;
export function before(...args: unknown[]): void;
export function beforeEach(...args: unknown[]): void;
export function after(...args: unknown[]): void;
export function afterEach(...args: unknown[]): void;
export function include(...testables: Testable[]): void;

export class GraphReporter {
  constructor(name?: string);

  withHarness(): this;

  withSuite(suite: Suite): this;

  withTest(test: Test): this;

  toGraph(): unknown;
}

export class MultiReporter {
  constructor(level?: number);

  add(...additions: unknown[]): this;

  withHarness(harness: Harness): this;

  withSuite(suite: Suite): this;

  withTest(test: Test): this;
}

export class NullReporter {
  withHarness(): this;

  withSuite(): this;

  withTest(): this;
}

export class SpecReporter extends StreamReporter {
  constructor(options?: Partial<{
    stream: Writable;
    colours: boolean;
    colors: boolean;
  }>, level?: number);

  withHarness(harness: Harness): void;

  withSuite(suite: Suite): this;

  withTest(test: Test): this;
}

export class StreamReporter {
  constructor(options?: unknown);

  stream: PassThrough;

  end(): void;
}

export class SurefireReporter extends StreamReporter {
  constructor(options?: Partial<{
    stream: Writable;
  }>);

  withHarness(harness: Harness): this;

  withSuite(): this;

  withTest(): this;
}

export class TapReporter extends StreamReporter {
  constructor(options?: Partial<{
    stream: Writable;
  }>);

  withHarness(harness: Harness): this;

  withSuite(suite: Suite): this;

  withTest(test: Test): this;
}
