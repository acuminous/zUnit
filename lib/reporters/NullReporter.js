class NullReporter {

  withSuite() {
    return this;
  }

  withTest() {
    return this;
  }
}

module.exports = NullReporter;
