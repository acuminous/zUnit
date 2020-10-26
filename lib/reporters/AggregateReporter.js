const RunnableEvents = require('../RunnableEvents');

class AggregateReporter {

  constructor() {
    this._stats = { passed: 0, failed: 0, skipped: 0 };
  }

  withSuite(suite) {
    return this;
  }

  withTest(test) {
    test.once(RunnableEvents.FINISHED, () => {
      switch (test.result) {
        case RunnableEvents.PASSED: {
          this._stats.passed++;
          this._result = this._result || RunnableEvents.PASSED;
          break;
        }
        case RunnableEvents.FAILED: {
          this._stats.failed++;
          this._result = RunnableEvents.FAILED;
          break;
        }
        case RunnableEvents.SKIPPED: {
          this._stats.skipped++;
          break;
        }
      }
    });
    return this;
  }

  get stats() {
    return this._stats;
  }

  get result() {
    return this._result;
  }

}

module.exports = AggregateReporter;
