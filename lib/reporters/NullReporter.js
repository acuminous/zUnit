class NullReporter {

  withSuite() {
    return this;
  }

  withTest(test) {
    return this;
  }
}

module.exports = NullReporter;
