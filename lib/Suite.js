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

  async run(reporter, runtimeOptions = {}, parentOptions = {}, force = true) {

    const suiteReporter = reporter.withSuite(this);

    this._start();

    // eslint-disable-next-line no-unused-vars
    const { exclusive, ...inheritableOptions } = Object.assign({}, defaults, parentOptions, this._options);
    const options = Object.assign({}, defaults, parentOptions, this._options, runtimeOptions);

    for (let i = 0; i < this._testables.length; i++) {
      const testable = this._testables[i];
      if (testable._shouldRun(force)) {
        try {
          await this._suiteHooks.runBefores();
          await testable.run(suiteReporter, runtimeOptions, inheritableOptions, testable._shouldForce(force));
          if (testable.failed && options.abort) inheritableOptions.skip = true;
        } finally {
          await this._suiteHooks.runAfters();
        }
      }
    }
    this._finish(options);
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
