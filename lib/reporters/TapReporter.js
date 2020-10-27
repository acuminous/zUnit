class TapReporter {

  withSuite() {
    return new TapReporter();
  }

  withTest() {
    return this;
  }

}

module.exports = TapReporter;
