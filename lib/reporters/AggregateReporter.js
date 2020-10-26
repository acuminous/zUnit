const RunnableEvents = require('../RunnableEvents');
const RunnableOutcomes = require('../RunnableOutcomes');

class AggregateReporter {

  constructor() {
    this._stats = { passed: 0, failed: 0, skipped: 0 };
    this._testOutcomeHandlers = {
      [RunnableOutcomes.PASSED]: () => this._testPassed(),
      [RunnableOutcomes.FAILED]: () => this._testFailed(),
      [RunnableOutcomes.SKIPPED]: () => this._testSkipped(),
    }
  }

  withSuite(suite) {
    return this;
  }

  withTest(test) {
    test.once(RunnableEvents.FINISHED, (result) => {
      this._testOutcomeHandlers[result]();
    });
    return this;
  }

  get stats() {
    return this._stats;
  }

  get result() {
    return this._result;
  }

  _testPassed() {
    this._stats.passed++;
    this._result = this._result || RunnableOutcomes.PASSED;
  }

  _testFailed() {
    this._stats.failed++;
    this._result = RunnableOutcomes.FAILED;
  }

  _testSkipped() {
    this._stats.skipped++;
  }
}

module.exports = AggregateReporter;
