const Testable = require('./Testable');
const TestableOutcomes = require('./TestableOutcomes');
const HookSet = require('./HookSet');

const defaults = {
  reason: 'No reason given',
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
    return this._testables.reduce((numberOfPasses, testable) => {
      return numberOfPasses + testable.numberOfPasses;
    }, 0);
  }

  get numberOfFailures() {
    return this._testables.reduce((numberOfFailures, testable) => {
      return numberOfFailures + testable.numberOfFailures;
    }, 0);
  }

  get numberOfSkipped() {
    return this._testables.reduce((numberOfSkipped, testable) => {
      if (!testable.skipped) return numberOfSkipped;
      return numberOfSkipped + testable.numberOfSkipped;
    }, 0);
  }

  hasExclusiveTests() {
    return this._testables.some(testable => testable._shouldRun(false));
  }

  before(...additions) {
    this._suiteHooks.addBefores(additions);
    return this;
  }

  beforeEach(...additions) {
    this._testHooks.addBefores(additions);
    return this;
  }

  after(...additions) {
    this._suiteHooks.addAfters(additions);
    return this;
  }

  afterEach(...additions) {
    this._testHooks.addAfters(additions);
    return this;
  }

  add(...additions) {
    this._testables = additions.reduce((testables, testable) => {
      return testables.concat(testable);
    }, this._testables);
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

    const testables = this._testables.filter((testable) => testable._shouldRun(force));

    for (let i = 0; i < testables.length; i++) {
      await this._runTestable(testables[i], suiteReporter, runtimeOptions, inheritableOptions, runOptions, force);
    }

    this._finish(runOptions);
  }

  _getInheritableOptions(runtimeOptions, inheritedOptions) {
    // eslint-disable-next-line no-unused-vars
    const { exclusive, ...inheritableOptions } = Object.assign({}, defaults, inheritedOptions, this._options, runtimeOptions);
    return inheritableOptions;
  }

  _getRunOptions(runtimeOptions, inheritedOptions) {
    return Object.assign({}, defaults, inheritedOptions, this._options, runtimeOptions);
  }

  async _runTestable(testable, reporter, runtimeOptions, inheritableOptions, runOptions, force) {
    try {
      await this._suiteHooks.runBefores();
      await testable.run(reporter, runtimeOptions, inheritableOptions, testable._shouldForce(force));
      if (testable.failed && runOptions.abort) inheritableOptions.skip = true;
    } finally {
      await this._suiteHooks.runAfters();
    }
  }

  _shouldRun(force) {
    return force || this.exclusive || this.hasExclusiveTests();
  }

  _shouldForce(force) {
    return force || this.exclusive && !this.hasExclusiveTests();
  }

  _finish(options) {
    if (options.skip) {
      this.result = TestableOutcomes.SKIPPED;
    } else if (this.numberOfFailures > 0) {
      this.result = TestableOutcomes.FAILED;
    } else {
      this.result = TestableOutcomes.PASSED;
    }
    super._finish();
  }
}

module.exports = Suite;
