const EventEmitter = require('events');
const RunnableEvents = require('./RunnableEvents');
const RunnableOutcomes = require('./RunnableOutcomes');

class Runnable  extends EventEmitter {

  constructor(name) {
    super();
    this._name = name;
  }

  get name() {
    return this._name;
  }

  get passed() {
    return this.result === RunnableOutcomes.PASSED;
  }

  get failed() {
    return this.result === RunnableOutcomes.FAILED;
  }

  get skipped() {
    return this.result === RunnableOutcomes.SKIPPED;
  }

  get duration() {
    return this.finished - this.started;
  }

  get exclusive() {
    return this._options.exclusive;
  }

  _start() {
    this.started = Date.now();
    this.emit(RunnableEvents.STARTED);
  }

  _finish() {
    this.finished = Date.now();
    this.emit(RunnableEvents.FINISHED, this.result);
  }

  _pass() {
    this.result = RunnableOutcomes.PASSED;
    this.emit(RunnableEvents.PASSED, this.result);
  }

  _fail() {
    this.result = RunnableOutcomes.FAILED;
    this.emit(RunnableEvents.FAILED, this.result);
  }

  _skip() {
    this.result = RunnableOutcomes.SKIPPED;
    this.emit(RunnableEvents.SKIPPED, this.result);
  }

}

module.exports = Runnable;
