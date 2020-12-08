const Fixture = require('./Fixture');

class Hook extends Fixture {

  constructor(name, fn) {
    super(name);
    this._fn = fn;
  }

  get name() {
    return this._name;
  }

  _finalise(parent) {
    const hook = new Hook(this._name, this._fn);
    hook._parent = parent;
    return hook;
  }

  async run() {
    const api = this._getApi();
    return this._fn(api);
  }

  _getApi() {
    return this._parent._decorateApi({
      name: this.name,
      description: this.description,
    });
  }
}

module.exports = Hook;
