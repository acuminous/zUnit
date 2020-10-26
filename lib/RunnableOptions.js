class RunnableOptions {

  constructor(options = {}, defaults) {
    Object.assign(this, defaults, options);
  }

  _abort() {
    this.skip = true;
  }

}

module.exports = RunnableOptions;
