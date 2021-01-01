const { appendAll } = require('./utils');

class HookSet {

  constructor() {
    this._befores = [];
    this._afters = [];
    this._started = false;
  }

  _finalise(parent) {
    const hookSet = new HookSet();
    hookSet._parent = parent;
    hookSet._befores = this._befores.map((hook) => hook._finalise(parent));
    hookSet._afters = this._afters.map((hook) => hook._finalise(parent));
    return hookSet;
  }

  addBefores(...additions) {
    this._befores = appendAll(this._befores, additions);
    return this;
  }

  addAfters(...additions) {
    this._afters = appendAll(this._afters, additions);
    return this;
  }

  async runBefores(options) {
    this._started = true;
    for (let i = 0; i < this._befores.length; i++) {
      await this._befores[i].run(options);
      if (this._parent.skipped) break;
    }
  }

  async runAfters(options) {
    if (!this._started) return;
    for (let i = 0; i < this._afters.length; i++) {
      await this._afters[i].run(options);
    }
  }
}

module.exports = HookSet;
