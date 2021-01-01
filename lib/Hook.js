const Runnable = require('./Runnable');
const Options = require('./Options');
const { timeout } = require('./utils');

const defaults = {
  timeout: 5000,
};

class Hook extends Runnable {

  constructor(name, fn, initial = {}) {
    super(name);
    this._fn = fn;
    this._options = new Options({ defaults, initial });
  }

  get name() {
    return this._name;
  }

  _finalise(parent) {
    const hook = new Hook(this._name, this._fn, this._options.initial);
    hook._parent = parent;
    return hook;
  }

  async run(propagatedOptions) {
    const options = this._options.apply(propagatedOptions);
    const done = this._makeDone();
    const api = this._getApi();
    const fn = this._fn(api, done.callback);
    await timeout(() => Promise.all([fn, done.promise]), options.get('timeout'));
  }

  _getApi() {
    return this._parent._decorateApi({
      name: this.name,
      description: this.description,
    });
  }
}

module.exports = Hook;
