class HookSet {

  constructor(params = {}) {
    this._befores = params.befores || [];
    this._afters = params.afters || [];
    this._started = false;
  }

  _finalise() {
    return new HookSet({ befores: this._befores, afters: this._afters });
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
    return this._runHooks(this._befores);
  }

  async runAfters() {
    if (!this._started) return;
    return this._runHooks(this._afters);
  }

  async _runHooks(hooks) {
    for (let i = 0; i < hooks.length; i++) {
      await hooks[i].run();
    }
  }

}

module.exports = HookSet;
