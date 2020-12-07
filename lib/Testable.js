const Fixture = require('./Fixture');
const TestableEvents = require('./TestableEvents');
const TestableOutcomes = require('./TestableOutcomes');

class Testable extends Fixture {

  get passed() {
    return this.result === TestableOutcomes.PASSED;
  }

  get failed() {
    return this.result === TestableOutcomes.FAILED;
  }

  get skipped() {
    return this.result === TestableOutcomes.SKIPPED;
  }

  get reason() {
    return this._reason;
  }

  get duration() {
    return this.finished - this.started;
  }

  get stats() {
    return {
      tested: this.numberOfTests,
      passed: this.numberOfPasses,
      failed: this.numberOfFailures,
      skipped: this.numberOfSkipped,
    };
  }

  get exclusive() {
    return Boolean(this._options.exclusive) && !this._options.skip;
  }

  _start() {
    this.started = Date.now();
    this.emit(TestableEvents.STARTED);
  }

  _finish() {
    this.finished = Date.now();
    this.emit(TestableEvents.FINISHED, this.result);
  }

  _pass() {
    this.result = TestableOutcomes.PASSED;
    this.emit(TestableEvents.PASSED, this.result);
  }

  _fail() {
    this.result = TestableOutcomes.FAILED;
    this.emit(TestableEvents.FAILED, this.result);
  }

  _skip(reason) {
    this.result = TestableOutcomes.SKIPPED;
    this._reason = reason;
    this.emit(TestableEvents.SKIPPED, this.result);
  }
}

module.exports = Testable;
