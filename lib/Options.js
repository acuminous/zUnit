class Options {

  constructor(options = {}) {
    this._scopes = {
      defaults: Object.assign({}, options.defaults),
      initial: Object.assign({}, options.initial),
      runtime: Object.assign({}, options.runtime),
      bequeathed: Object.assign({}, options.bequeathed),
    };
  }

  get defaults() {
    return this._scopes.defaults;
  }

  get initial() {
    return this._scopes.initial;
  }

  get runtime() {
    return this._scopes.runtime;
  }

  get bequeathed() {
    return this._scopes.bequeathed;
  }

  get(name) {
    return this.export()[name];
  }

  export() {
    return Object.assign(
      {},
      this._scopes.defaults,
      this._scopes.initial,
      this._scopes.runtime,
      this._scopes.bequeathed,
    );
  }

  apply(other) {
    const { defaults, runtime, bequeathed } = other;
    // eslint-disable-next-line no-unused-vars
    const { exclusive, ...initial } = other.initial;

    return new Options({
      defaults: Object.assign({}, defaults, this._scopes.defaults),
      initial: Object.assign({}, initial, this._scopes.initial),
      runtime: Object.assign({}, runtime),
      bequeathed: Object.assign({}, bequeathed),
    });
  }

  bequeath(options) {
    Object.assign(this._scopes.bequeathed, options);
  }
}

module.exports = Options;
