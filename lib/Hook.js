class Hook {

  constructor(name, fn) {
    this._name = name;
    this._fn = fn;
  }

  async run() {
    return this._fn();
  }
}

module.exports = Hook;
