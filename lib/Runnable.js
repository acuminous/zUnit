const EventEmitter = require('events');

class Runnable  extends EventEmitter {

  constructor(name, type) {
    super();
    this._name = name;
    this._type = type;
  }

  get name() {
    return this._name;
  }

  get type() {
    return this._type;
  }


}

module.exports = Runnable;
