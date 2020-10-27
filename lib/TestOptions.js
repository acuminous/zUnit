const RunnableOptions = require('./RunnableOptions');

const defaults = {
  timeout: 5000,
};

class TestOptions extends RunnableOptions {

  constructor(options) {
    super(options, defaults);
  }

  _combine(options) {
    return new TestOptions({ ...this, ...options });
  }

}

module.exports = TestOptions;
