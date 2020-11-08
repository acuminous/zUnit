const StreamReporter = require('./StreamReporter');
const RunnableEvents = require('../RunnableEvents');
const RunnableOutcomes = require('../RunnableOutcomes');

class TapReporter extends StreamReporter {

  constructor(options = {}) {
    super(options);
    this._testOutcomeHandlers = {
      [RunnableOutcomes.PASSED]: (test) => this._testPassed(test),
      [RunnableOutcomes.FAILED]: (test) => this._testFailed(test),
      [RunnableOutcomes.SKIPPED]: (test) => this._testSkipped(test),
    };
  }

  withHarness(harness) {
    harness.on(RunnableEvents.STARTED, () => {
      this._writeln('TAP version 13');
      this._writeln(`1..${harness.numberOfTests}`);
    });
    return this;
  }

  withSuite() {
    return this;
  }

  withTest(test) {
    test.once(RunnableEvents.FINISHED, (result) => {
      this._testOutcomeHandlers[result](test);
    });
    return this;
  }

  _testPassed(test) {
    this._writeln(`ok ${test.number} - ${test.description}`);
  }

  _testFailed(test) {
    this._writeln(`not ok ${test.number} - ${test.description}`);
    this._writeln(test.error.stack.replace(/^/gm, '# '));
  }

  _testSkipped(test) {
    this._writeln(`ok ${test.number} - ${test.description} # skip ${test.reason}`);
  }
}

module.exports = TapReporter;
