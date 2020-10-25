const Events = require('../Events');

class AggregateReporter {

  constructor() {
    this._stats = { passed: 0, failed: 0, skipped: 0 };
  }

  withSuite(suite) {
    return this;
  }

  withTest(test) {
    test.once(Events.TEST_FINISHED, () => {
      switch (test.result) {
        case Events.TEST_PASSED: {
          this._stats.passed++;
          break;
        }
        case Events.TEST_FAILED: {
          this._stats.failed++;
          break;
        }
        case Events.TEST_SKIPPED: {
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
  }

}

module.exports = AggregateReporter;
