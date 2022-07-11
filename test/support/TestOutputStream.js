const { EOL } = require('os');
const { Writable } = require('stream');

class TestOutputStream extends Writable {
  constructor() {
    super();
    this._chunks = [];
  }

  get lines() {
    return this._chunks.join('').split(EOL);
  }

  write(chunk) {
    this._chunks.push(chunk);
  }
}

module.exports = TestOutputStream;
