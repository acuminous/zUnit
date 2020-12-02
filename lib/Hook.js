class Hook {

  constructor(name, fn) {
    this._name = name;
    this._fn = fn;
  }

  get name() {
    return this._name;
  }

  async run() {
    return this._fn();
  }
}

module.exports = Hook;
