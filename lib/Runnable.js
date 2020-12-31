const EventEmitter = require('events');

class Runnable extends EventEmitter {

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

  _makeDone() {
    let alreadyCalled = false;
    let callback;
    const promise = this._fn.length > 1
      ? new Promise((resolve, reject) => {
        callback = (err) => {
          if (alreadyCalled) throw new Error('done already called');
          alreadyCalled = true;
          return err ? reject(err) : resolve();
        };
      }) : Promise.resolve();
    return { callback, promise };
  }

}

module.exports = Runnable;
