const StreamReporter = require('./StreamReporter');
const Events = require('../Events');
const Outcomes = require('../Outcomes');

class TapReporter extends StreamReporter {

  constructor(options = {}) {
    super({ ...options });
    this._testOutcomeHandlers = {
      [Outcomes.PASSED]: (test) => this._testPassed(test),
      [Outcomes.FAILED]: (test) => this._testFailed(test),
      [Outcomes.SKIPPED]: (test) => this._testSkipped(test),
    };
  }

  withHarness(harness) {
    harness.on(Events.STARTED, () => {
      this._writeln('TAP version 13');
      this._writeln(`1..${harness.numberOfTests}`);
    });
    harness.on(Events.FINISHED, () => {
      this.end();
    });
    return this;
  }

  withSuite(suite) {
    suite.once(Events.FAILED, () => {
      this._diagnostic(suite.error.stack);
    });
    return new TapReporter(this._options);
  }

  withTest(test) {
    test.once(Events.FINISHED, (result) => {
      this._testOutcomeHandlers[result](test);
    });
    return this;
  }

  _diagnostic(text) {
    this._writeln(text.replace(/^/mg, '# '));
  }

  _testPassed(test) {
    this._writeln(`ok ${test.point} - ${test.description}`);
  }

  _testFailed(test) {
    this._writeln(`not ok ${test.point} - ${test.description}`);
    this._diagnostic(test.error.stack);
  }

  _testSkipped(test) {
    this._writeln(`ok ${test.point} - ${test.description} # skip ${test.reason}`);
  }
}

module.exports = TapReporter;
