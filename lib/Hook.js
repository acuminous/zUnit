const Runnable = require('./Runnable');
const { timeout } = require('./utils');

const defaults = {
  timeout: 5000,
};

class Hook extends Runnable {

  constructor(name, fn, options = {}) {
    super(name);
    this._fn = fn;
    this._options = options;
  }

  get name() {
    return this._name;
  }

  _finalise(parent) {
    const hook = new Hook(this._name, this._fn, this._options);
    hook._parent = parent;
    return hook;
  }

  async run(runtimeOptions, ancestorOptions) {
    const runOptions = this._getRunOptions(runtimeOptions, ancestorOptions);
    const done = this._makeDone();
    const api = this._getApi();
    const fn = this._fn(api, done.callback);
    await timeout(() => Promise.all([fn, done.promise]), runOptions.timeout);
  }

  _getRunOptions(runtimeOptions, ancestorOptions) {
    return Object.assign({}, defaults, ancestorOptions, this._options, runtimeOptions);
  }

  _getApi() {
    return this._parent._decorateApi({
      name: this.name,
      description: this.description,
    });
  }
}

module.exports = Hook;
