class RunnableOptions {

  constructor(options = {}, defaults) {
    Object.assign(this, defaults, options);
  }

  _abort() {
    this.skip = true;
  }

  _combine(options) {
    return new RunnableOptions({ ...this, ...options });
  }

}

module.exports = RunnableOptions;
