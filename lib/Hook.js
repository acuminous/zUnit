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
    const hook = this._clone(this._name, this._fn);
    hook._parent = parent;
    return hook;
  }

  async run() {
    const api = this._getApi();
    return this._fn(api);
  }

  toBefore() {
    return new Before(this._name, this._fn);
  }

  toAfter() {
    return new After(this._name, this._fn);
  }

  _getApi() {
    return {
      name: this.name,
      description: this.description,
      test: this._parent._getApi(this.skippable),
    };
  }
}

class Before extends Hook {

  get skippable() {
    return true;
  }

  _clone(name, fn) {
    return new Before(name, fn);
  }
}

class After extends Hook {
  get skippable() {
    return false;
  }

  _clone(name, fn) {
    return new After(name, fn);
  }
}

module.exports = Hook;
