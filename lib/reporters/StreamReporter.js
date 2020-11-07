const { EOL } = require('os');

class StreamReporter {

  constructor(options = {}, defaults = {}) {
    this._options = this._applyDefaults(options, defaults);
  }

  _applyDefaults(defaults, options) {
    return Object.assign({ stream: process.stdout }, defaults, options);
  }

  _write(text) {
    this._options.stream.write(text);
  }

  _writeln(text = '') {
    this._write(text);
    this._write(EOL);
  }

}

module.exports = StreamReporter;
