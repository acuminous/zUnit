const { PassThrough } = require('stream');
const { EOL } = require('os');

class StreamReporter {
  constructor(options = {}) {
    this._options = { stream: process.stdout, ...options };
    this._options.stream.setMaxListeners(this._options.stream.getMaxListeners() + 1);
    this._stream = new PassThrough();
    this._stream.pipe(this._options.stream);
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

  end() {
    this._stream.unpipe(this._options.stream);
    this._options.stream.setMaxListeners(this._options.stream.getMaxListeners() - 1);
  }
}

module.exports = StreamReporter;
