const Runnable = require('./Runnable');
const Events = require('./Events');
const Outcomes = require('./Outcomes');

class Testable extends Runnable {

  get passed() {
    return this.result === Outcomes.PASSED;
  }

  get failed() {
    return this.result === Outcomes.FAILED;
  }

  get skipped() {
    return this.result === Outcomes.SKIPPED;
  }

  get reason() {
    return this._reason;
  }

  get stats() {
    return {
      tests: this.numberOfTests,
      passed: this.numberOfPasses,
      failed: this.numberOfFailures,
      skipped: this.numberOfSkipped,
      duration: this.finished - this.started,
    };
  }

  get exclusive() {
    return Boolean(this._options.get('exclusive')) && !this._options.get('skip');
  }

  _start() {
    this.started = Date.now();
    this.emit(Events.STARTED);
  }

  _finish() {
    this.finished = Date.now();
    this.emit(Events.FINISHED, this.result);
  }

  _pass() {
    this.result = Outcomes.PASSED;
    this.emit(Events.PASSED, this.result);
  }

  _fail() {
    this.result = Outcomes.FAILED;
    this.emit(Events.FAILED, this.result);
  }

  _skip(reason) {
    this.result = Outcomes.SKIPPED;
    this._reason = reason;
    this.emit(Events.SKIPPED, this.result);
  }

  _getApi() {
    const api = { name: this.name, description: this.description };
    return this._run ? api : { ...api, skip: (reason) => this._skip(reason) };
  }
}

module.exports = Testable;
