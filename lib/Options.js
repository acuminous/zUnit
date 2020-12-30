class Options {

  constructor(options = {}) {
    this._defaults = options.defaults || {};
    this._inherited = options.inherited || {};
    this._configured = options.configured || {};
    this._runtime = options.runtime || {};
  }

  get defaults() {
    return Object.assign({}, this._defaults);
  }

  get inherited() {
    return Object.assign({}, this._inherited);
  }

  get configured() {
    return Object.assign({}, this._configured);
  }

  get runtime() {
    return Object.assign({}, this._runtime);
  }

  inherit(options) {
    return new Options({ inherited: options });
  }

  configure(options) {
    return new Options({ configured: options });
  }

  run(options) {
    return new Options({ runtime: options });
  }

  _merge({ defaults = this._defaults, inherited = this._inherited, configured = this._configured, runtime = this._runtime }) {
    return new Options({ defaults, inherited, configured, runtime });
  }

  get inheritable() {
    // eslint-disable-next-line no-unused-vars
    const { exclusive, ...inheritableOptions } = Object.assign({}, this._defaults, this._inherited, this._configured, this._runtime);
    return inheritableOptions;
  }

  get export() {
    return Object.assign({}, this._defaults, this._inherited, this._configured, this._runtime);
  }

}

module.exports = Options;
