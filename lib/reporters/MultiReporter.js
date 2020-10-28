class MultiReporter {

  constructor(level = 0) {
    this._level = level;
    this._reporters = [];
  }

  add(...additions) {
    this._reporters = additions.reduce((reporters, reporter) => {
      return reporters.concat(reporter);
    }, this._reporters);
    return this;
  }

  withHarness(harness) {
    this._reporters.forEach((reporter) => {
      reporter.withHarness(harness);
    });
    return this;
  }

  withSuite(suite) {
    return this._reporters.reduce((multiReporter, reporter) => {
      return multiReporter.add(reporter.withSuite(suite));
    }, new MultiReporter(this._level + 1));
  }

  withTest(test) {
    this._reporters.forEach((reporter) => {
      reporter.withTest(test);
    });
    return this;
  }

}

module.exports = MultiReporter;
