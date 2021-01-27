import EventEmitter from 'events';
import { PassThrough, Writable } from 'stream';

type EventsType = {
  PASSED: 'passed';
  FAILED: 'failed';
  SKIPPED: 'skipped';
  STARTED: 'started';
  FINISHED: 'finished';
}

type zUnitReporter = {
  withHarness(harness: Harness): Harness;
  withSuite(suite: Suite): Suite;
  withTest(test: Test): Test;
}

type zUnitOptions = Partial<{
  timeout: number;
  exclusive: boolean;
  skip: boolean;
  reason: string;
  pattern: RegExp;
  directory: string;
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

declare class GraphNode {
  type: 'suite' | 'test';
  name: string;
  description: string;
  point: number;
  parent: GraphNode | null;
  children: GraphNode[];
  result: 'PASSED' | 'FAILED' | 'SKIPPED';
  errors: Error[];
  reason: string;
  stats: {
    tests: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  }
  incomplete: boolean;

  constructor(type: 'suite' | 'test', name: string, description: string, point: number, parent?: GraphNode);

  isSuite(): boolean;

  isTest(): boolean;

  passed: boolean;

  failed: boolean;

  skipped: boolean;

  resolve(...indexes: number[]): GraphNode;

  add(...additions: GraphNode[]): this;

  add(additions: GraphNode[]): this;

  finish({ result, errors, reason, stats }: {
    result: 'PASSED' | 'FAILED' | 'SKIPPED';
    errors: Error[];
    reason: string;
    stats: {
      tests: number;
      passed: number;
      failed: number;
      skipped: number;
      duration: number;
    }
  }): void;

  private _orphan(): GraphNode;
}

export const Events: EventsType;

export class Harness extends EventEmitter.EventEmitter {
  constructor(testable: Testable, initial?: Pick<zUnitOptions, 'timeout'>);

  numberOfTests: number;

  report: GraphNode;

  run(reporter: zUnitReporter, runtime?: Pick<zUnitOptions, 'timeout'>): Promise<unknown>;
}

export class Hook extends Runnable {
  constructor(name: string, fn: Function, initial?: Pick<zUnitOptions, 'timeout'>);

  name: string;

  run(propagatedOptions: Pick<zUnitOptions, 'timeout'>): Promise<void>;
}

export class HookSet {
  addBefores(...additions: Hook[]): this;

  addBefores(additions: Hook[]): this;

  addAfters(...additions: Hook[]): this;

  addAfters(additions: Hook[]): this;

  runBefores(options: zUnitOptions): Promise<void>;

  runAfters(options: zUnitOptions): Promise<void>;
}

export class Options {
  constructor(options?: zUnitOptions);

  defaults: zUnitOptions;

  initial: zUnitOptions;

  runtime: zUnitOptions;

  bequeathed: zUnitOptions;

  get<T extends keyof zUnitOptions, U extends zUnitOptions[T]>(name: T): U;

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
    filter: (str: string) => boolean;
  }>): Testable;

  hasExclusiveTests(): boolean;

  hasFailures(): boolean;

  before(...additions: Hook[]): this;

  before(additions: Hook[]): this;

  beforeEach(...additions: Hook[]): this;

  beforeEach(additions: Hook[]): this;

  after(...additions: Hook[]): this;

  after(additions: Hook[]): this;

  afterEach(...additions: Hook[]): this;

  afterEach(additions: Hook[]): this;

  add(...additions: Testable[]): this;

  add(additions: Testable[]): this;

  run(reporter: zUnitReporter, propagatedOptions: zUnitOptions, force?: boolean): Promise<void>;
}

export class Test extends Testable {
  constructor(name: string, fn: Function, initial?: Pick<zUnitOptions, 'timeout' | 'exclusive' | 'skip' | 'reason'>);

  point: number;

  numberOfTests: number;

  numberOfPasses: number;

  numberOfFailures: number;

  numberOfSkipped: number;

  pending: boolean;

  hasExclusiveTests(): boolean;

  run(reporter: zUnitReporter, propagatedOptions: Pick<zUnitOptions, 'timeout' | 'exclusive' | 'skip' | 'reason'>): Promise<void>;
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

export function describe(name: string, fn: Function, options?: Pick<zUnitOptions, 'timeout' | 'exclusive' | 'skip' | 'reason'>): Suite;
export function xdescribe(name: string, fn: Function, options?: Pick<zUnitOptions, 'timeout' | 'exclusive' | 'skip' | 'reason'>): Suite;
export function odescribe(name: string, fn: Function, options?: Pick<zUnitOptions, 'timeout' | 'exclusive' | 'skip' | 'reason'>): Suite;
export function it(name: string, fn: Function, options?: Pick<zUnitOptions, 'timeout' | 'exclusive' | 'skip' | 'reason'>): void;
export function xit(name: string, fn: Function, options?: Pick<zUnitOptions, 'timeout' | 'exclusive' | 'skip' | 'reason'>): void;
export function oit(name: string, fn: Function, options?: Pick<zUnitOptions, 'timeout' | 'exclusive' | 'skip' | 'reason'>): void;
export function before(name: string, fn: Function, options?: Pick<zUnitOptions, 'timeout'>): void;
export function before(fn: Function, options?: Pick<zUnitOptions, 'timeout'>): void;
export function beforeEach(name: string, fn: Function, options?: Pick<zUnitOptions, 'timeout'>): void;
export function beforeEach(fn: Function, options?: Pick<zUnitOptions, 'timeout'>): void;
export function after(name: string, fn: Function, options?: Pick<zUnitOptions, 'timeout'>): void;
export function after(fn: Function, options?: Pick<zUnitOptions, 'timeout'>): void;
export function afterEach(name: string, fn: Function, options?: Pick<zUnitOptions, 'timeout'>): void;
export function afterEach(fn: Function, options?: Pick<zUnitOptions, 'timeout'>): void;
export function include(...testables: Testable[]): void;
export function include(testables: Testable[]): void;

export class GraphReporter implements zUnitReporter {
  constructor(name?: string);

  withHarness(harness: Harness): Harness;

  withSuite(suite: Suite): Suite;

  withTest(test: Test): Test;

  toGraph(): unknown;
}

export class MultiReporter implements zUnitReporter {
  constructor(level?: number);

  withHarness(harness: Harness): Harness;

  withSuite(suite: Suite): Suite;

  withTest(test: Test): Test;

  add(...additions: Reporter[]): this;

  add(additions: Reporter[]): this;
}

export class NullReporter implements zUnitReporter {
  withHarness(harness: Harness): Harness;

  withSuite(suite: Suite): Suite;

  withTest(test: Test): Test;
}

export class SpecReporter extends StreamReporter {
  constructor(options?: Partial<{
    stream: Writable;
    colours: boolean;
    colors: boolean;
  }>, level?: number);

  withHarness(harness: Harness): Harness;

  withSuite(suite: Suite): Suite;

  withTest(test: Test): Test;
}

export class StreamReporter implements zUnitReporter {
  constructor(options?: unknown);

  stream: PassThrough;

  end(): void;
}

export class SurefireReporter extends StreamReporter {
  constructor(options?: Partial<{
    stream: Writable;
  }>);

  withHarness(harness: Harness): Harness;

  withSuite(suite: Suite): Suite;

  withTest(test: Test): Test;
}

export class TapReporter extends StreamReporter {
  constructor(options?: Partial<{
    stream: Writable;
  }>);

  withHarness(harness: Harness): Harness;

  withSuite(suite: Suite): Suite;

  withTest(test: Test): Test;
}
