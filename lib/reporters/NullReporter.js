class NullReporter {
  withHarness() {
    return this;
  }

  withSuite() {
    return this;
  }

  withTest() {
    return this;
  }
}

module.exports = NullReporter;
