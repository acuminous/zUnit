const path = require('path');
const Testable = require('./Testable');
const Outcomes = require('./Outcomes');
const HookSet = require('./HookSet');
const { appendAll, findFiles } = require('./utils');

const defaults = {
  reason: 'No reason given',
  pattern: /^[\w-]+\.test\.js$/,
  directory: path.join(process.cwd(), 'test'),
};

class Suite extends Testable {

  constructor(name, options = {}) {
    super(name);
    this._testables = [];
    this._options = options;
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
    return this.error
      ? 0
      : this._testables.reduce((numberOfPasses, testable) => {
        return numberOfPasses + testable.numberOfPasses;
      }, 0);
  }

  get numberOfFailures() {
    return this.error
      ? this.numberOfTests - this.numberOfSkipped
      : this._testables.reduce((numberOfFailures, testable) => {
        return numberOfFailures + testable.numberOfFailures;
      }, 0);
  }

  get numberOfSkipped() {
    return this._testables.reduce((numberOfSkipped, testable) => {
      return numberOfSkipped + testable.numberOfSkipped;
    }, 0);
  }

  discover(runtimeOptions = {}) {
    const options = Object.assign(defaults, this._options, runtimeOptions);

    return findFiles(options)
      .map(filePath => require(filePath))
      .reduce((suite, testable) => suite.add(testable), this);
  }

  hasExclusiveTests() {
    return this._testables.some(testable => testable._shouldRun(false));
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
    const suite = new Suite(this._name, this._options);
    suite._suiteHooks = this._suiteHooks._finalise(suite);
    return this._testables.reduce((suite, testable) => {
      const testHooks = inheritedTestHooks.concat(this._testHooks);
      const finalised = testable._finalise(this, offset + suite.numberOfTests, testHooks);
      return suite.add(finalised);
    }, suite);
  }

  async run(reporter, runtimeOptions = {}, inheritedOptions = {}, force = true) {

    const suiteReporter = reporter.withSuite(this);

    this._start();

    const inheritableOptions = this._getInheritableOptions(runtimeOptions, inheritedOptions);
    const runOptions = this._getRunOptions(runtimeOptions, inheritedOptions);

    try {
      const testables = this._testables.filter((testable) => testable._shouldRun(force));
      await this._runAll(testables, suiteReporter, runtimeOptions, inheritableOptions, runOptions, force);
    } catch (error) {
      this.error = error;
      this._fail();
    } finally {
      this._finish(runOptions);
    }
  }

  _getInheritableOptions(runtimeOptions, inheritedOptions) {
    // eslint-disable-next-line no-unused-vars
    const { exclusive, ...inheritableOptions } = Object.assign({}, defaults, inheritedOptions, this._options, runtimeOptions);
    return inheritableOptions;
  }

  _getRunOptions(runtimeOptions, inheritedOptions) {
    return Object.assign({}, defaults, inheritedOptions, this._options, runtimeOptions);
  }

  async _runAll(testables, reporter, runtimeOptions, inheritableOptions, runOptions, force) {
    try {
      if (this._shouldRunHooks(runOptions, testables)) await this._suiteHooks.runBefores();
      if (this.skipped) Object.assign(inheritableOptions, { skip: true, reason: this.reason });
      for (let i = 0; i < testables.length; i++) {
        await this._runTestable(testables[i], reporter, runtimeOptions, inheritableOptions, runOptions, force);
      }
    } finally {
      this._run = true;
      if (this._shouldRunHooks(runOptions, testables)) await this._suiteHooks.runAfters();
    }
  }

  async _runTestable(testable, reporter, runtimeOptions, inheritableOptions, runOptions, force) {
    await testable.run(reporter, runtimeOptions, inheritableOptions, testable._shouldForce(force));
    if (testable.failed && runOptions.abort) inheritableOptions.skip = true;
  }

  _shouldRun(force) {
    return force || this.exclusive || this.hasExclusiveTests();
  }

  _shouldRunHooks(runOptions, testables) {
    return !runOptions.skip && testables.length;
  }

  _shouldForce(force) {
    return force || this.exclusive && !this.hasExclusiveTests();
  }

  _finish(options) {
    if (this.result) {
      // Do Nothing
    } else if (options.skip) {
      this.result = Outcomes.SKIPPED;
    } else if (this.numberOfFailures > 0) {
      this.result = Outcomes.FAILED;
    } else {
      this.result = Outcomes.PASSED;
    }
    super._finish();
  }

  _decorateApi(api) {
    return { ...api, suite: this._getApi() };
  }
}

module.exports = Suite;
