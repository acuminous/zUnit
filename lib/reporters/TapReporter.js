class TapReporter {

  withSuite(suite) {
    return new TapReporter()
  }

  withTest(test) {
    return this;
  }

}

module.exports = TapReporter;
