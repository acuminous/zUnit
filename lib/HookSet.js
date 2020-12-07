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
    this._befores = this._addHooks(this._befores, additions);
    return this;
  }

  addAfters(...additions) {
    this._afters = this._addHooks(this._afters, additions);
    return this;
  }

  _addHooks(seed, additions) {
    return additions.reduce((hooks, hook) => {
      return hooks.concat(hook);
    }, seed);
  }

  async runBefores() {
    this._started = true;
    for (let i = 0; i < this._befores.length; i++) {
      await this._befores[i].run();
      if (this._parent.skipped) break;
    }
  }

  async runAfters() {
    if (!this._started) return;
    for (let i = 0; i < this._afters.length; i++) {
      await this._afters[i].run();
    }
  }
}

module.exports = HookSet;
