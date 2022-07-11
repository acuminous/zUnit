const Locals = class {
  constructor(params = {}) {
    this._properties = {};
    this._parent = params.parent;
  }

  get(name) {
    if (Object.prototype.hasOwnProperty.call(this._properties, name)) return this._properties[name];
    if (this._parent) return this._parent.get(name);
  }

  set(name, value) {
    this._properties[name] = value;
  }

  del(name) {
    delete this._properties[name];
  }

  child() {
    return new Locals({ parent: this });
  }
};

module.exports = Locals;
