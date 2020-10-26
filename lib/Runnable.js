const EventEmitter = require('events');
const RunnableEvents = require('./RunnableEvents');

class Runnable  extends EventEmitter {

  constructor(name, type) {
    super();
    this._name = name;
    this._type = type;
  }

  get name() {
    return this._name;
  }

  get type() {
    return this._type;
  }

  get passed() {
    return this.result === RunnableEvents.PASSED;
  }

  get failed() {
    return this.result === RunnableEvents.FAILED;
  }

  get skipped() {
    return this.result === RunnableEvents.SKIPPED;
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

  _finish(runtimeOptions) {
    this.finished = Date.now();
    this.emit(this.result);
    this.emit(RunnableEvents.FINISHED);
  }

  _pass() {
    this.result = RunnableEvents.PASSED;
    this.emit(RunnableEvents.PASSED);
  }

  _fail() {
    this.result = RunnableEvents.FAILED;
    this.emit(RunnableEvents.FAILED);
  }

  _skip() {
    this.result = RunnableEvents.SKIPPED;
    this.emit(RunnableEvents.SKIPPED);
  }

}

module.exports = Runnable;
