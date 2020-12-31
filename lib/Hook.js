const Fixture = require('./Fixture');
const { timeout } = require('./utils');

const defaults = {
  timeout: 5000,
};

class Hook extends Fixture {

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

  async run(runtimeOptions, inheritedOptions) {
    const options = Object.assign({}, defaults, inheritedOptions, this._options, runtimeOptions);
    const done = this._makeDone();
    const api = this._getApi();
    const fn = this._fn(api, done.callback);
    await timeout(() => Promise.all([fn, done.promise]), options.timeout);
  }

  _makeDone() {
    let alreadyCalled = false;
    let callback;
    const promise = this._fn.length > 1
      ? new Promise((resolve, reject) => {
        callback = (err) => {
          if (alreadyCalled) throw new Error('done already called');
          alreadyCalled = true;
          return err ? reject(err) : resolve();
        };
      }) : Promise.resolve();
    return { callback, promise };
  }

  _getApi() {
    return this._parent._decorateApi({
      name: this.name,
      description: this.description,
    });
  }
}

module.exports = Hook;
