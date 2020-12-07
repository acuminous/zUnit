const EventEmitter = require('events');

class Fixture extends EventEmitter {

  constructor(name) {
    super();
    this._name = name;
  }

  get name() {
    return this._name;
  }

  get description() {
    return this._parent ? `${this._parent.description} / ${this.name}` : this.name;
  }

}

module.exports = Fixture;
