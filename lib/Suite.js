const path = require('path');
const Testable = require('./Testable');
const Outcomes = require('./Outcomes');
const Options = require('./Options');
const HookSet = require('./HookSet');

const { appendAll, findFiles } = require('./utils');

const defaults = {
  pattern: /^[\w-]+\.test\.js$/,
  directory: path.join(process.cwd(), 'test'),
};

class Suite extends Testable {

  constructor(name, initial = {}) {
    super(name);
    this._testables = [];
    this._options = new Options({ defaults, initial });
    this._suiteHooks = new HookSet();
    this._testHooks = new HookSet();
  }

  get pending() {
    return this._testables.length === 0;
  }

  get numberOfTests() {
    return this._testables.reduce((numberOfTests, testable) => {
      return numberOfTests + testable.numberOfTests;
    }, 0);
  }

  get numberOfPasses() {
    return this._testables.reduce((numberOfPasses, testable) => {
      return numberOfPasses + testable.numberOfPasses;
    }, 0);
  }

  get numberOfFailures() {
    return  this._testables.reduce((numberOfFailures, testable) => {
      return numberOfFailures + testable.numberOfFailures;
    }, 0);
  }

  get numberOfSkipped() {
    return this._testables.reduce((numberOfSkipped, testable) => {
      return numberOfSkipped + testable.numberOfSkipped;
    }, 0);
  }

  discover(runtime = {}) {
    const runtimeOptions = new Options({ runtime });
    const options = this._options.apply(runtimeOptions);

    return findFiles(options.export())
      .map(filePath => require(filePath))
      .reduce((suite, testable) => suite.add(testable), this);
  }

  hasExclusiveTests() {
    return this._testables.some(testable => testable._shouldRun(false));
  }

  hasFailures() {
    return this._testables.some(testable => testable.failed);
  }

  before(...additions) {
    this._suiteHooks.addBefores(...additions);
    return this;
  }

  beforeEach(...additions) {
    this._testHooks.addBefores(...additions);
    return this;
  }

  after(...additions) {
    this._suiteHooks.addAfters(...additions);
    return this;
  }

  afterEach(...additions) {
    this._testHooks.addAfters(...additions);
    return this;
  }

  add(...additions) {
    this._testables = appendAll(this._testables, additions);
    return this;
  }

  _finalise(parent, offset = 1, inheritedTestHooks = []) {
    const suite = new Suite(this._name, this._options.initial);
    suite._parent = parent;
    suite._suiteHooks = this._suiteHooks._finalise(suite);
    return this._testables.reduce((suite, testable) => {
      const testHooks = inheritedTestHooks.concat(this._testHooks);
      const finalised = testable._finalise(suite, offset + suite.numberOfTests, testHooks);
      return suite.add(finalised);
    }, suite);
  }

  async run(reporter, propagatedOptions, force = true) {
    const suiteReporter = reporter.withSuite(this);

    const options = this._options.apply(propagatedOptions);

    this._start();

    try {
      const testables = this._testables.filter((testable) => testable._shouldRun(force));
      await this._runAll(testables, suiteReporter, options, force);
    } catch (error) {
      this._fail(error);
    } finally {
      this._finish(options);
    }
  }

  async _runAll(testables, reporter, options, force) {
    try {
      if (this._shouldRunHooks(options, testables)) await this._suiteHooks.runBefores(options);
      if (this.skipped) options.bequeath({ skip: true, reason: this.reason });
      for (let i = 0; i < testables.length; i++) {
        await this._runTestable(testables[i], reporter, options, force);
      }
    } finally {
      this._run = true;
      await this._suiteHooks.runAfters(options);
    }
  }

  async _runTestable(testable, reporter, options, force) {
    await testable.run(reporter, options, testable._shouldForce(force));
    if (testable.failed && options.get('abort')) options.bequeath({ skip: true });
  }

  _shouldRunHooks(options, testables) {
    return !options.get('skip') && testables.length;
  }

  _shouldRun(force) {
    return force || this.exclusive || this.hasExclusiveTests();
  }

  _shouldForce(force) {
    return force || this.exclusive && !this.hasExclusiveTests();
  }

  _finish(options) {
    if (this.result) {
      // Do Nothing
    } else if (options.skip) {
      this.result = Outcomes.SKIPPED;
    } else {
      this.result = this.hasFailures() ? Outcomes.FAILED : Outcomes.PASSED;
    }
    super._finish();
  }

  _decorateApi(api) {
    return { ...api, suite: this._getApi() };
  }
}

module.exports = Suite;
