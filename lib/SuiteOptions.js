const RunnableOptions = require('./RunnableOptions');

const defaults = {
};

class SuiteOptions extends RunnableOptions {

  constructor(options) {
    super(options, defaults);
  }

  _combine(options) {
    return new SuiteOptions({ ...this, ...options });
  }

  _propagate() {
    // eslint-disable-next-line no-unused-vars
    const { exclusive, ...options } = this;
    return new SuiteOptions(options);
  }

}

module.exports = SuiteOptions;
