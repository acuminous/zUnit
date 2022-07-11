class Options {
  constructor(options = {}) {
    this._scopes = {
      defaults: { ...options.defaults },
      initial: { ...options.initial },
      runtime: { ...options.runtime },
      bequeathed: { ...options.bequeathed },
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
    return { ...this.defaults, ...this.initial, ...this.runtime, ...this.bequeathed };
  }

  apply(other) {
    // eslint-disable-next-line no-unused-vars
    const { exclusive, ...initial } = other.initial;
    const { defaults, runtime, bequeathed } = other;

    return new Options({
      defaults: { ...defaults, ...this.defaults },
      initial: { ...initial, ...this.initial },
      runtime: { ...runtime, ...this.runtime },
      bequeathed: { ...bequeathed, ...this.bequeathed },
    });
  }

  bequeath(options) {
    Object.assign(this._scopes.bequeathed, options);
  }
}

module.exports = Options;
