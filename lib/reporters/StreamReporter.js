const { PassThrough } = require('stream');
const { EOL } = require('os');

class StreamReporter {

  constructor(options = {}) {
    this._options = { stream: process.stdout, ...options };
    this._stream = new PassThrough().pipe(this._options.stream);
  }

  get stream() {
    return this._stream;
  }

  _write(text) {
    this._stream.write(text);
  }

  _writeln(text = '') {
    this._write(text);
    this._write(EOL);
  }

}

module.exports = StreamReporter;
