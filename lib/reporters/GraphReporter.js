const Events = require('../Events');

class GraphReporter {

  constructor() {
    this._currentNode = { name: 'root', children: [] };
  }

  withSuite(suite) {
    suite.once(Events.SUITE_STARTED, () => {
      const newNode = ({ name: suite.name, parent: this._currentNode, children: [] });
      this._currentNode.children.push(newNode);
      this._currentNode = newNode;
    });
    suite.once(Events.SUITE_FINISHED, () => {
      this._currentNode.duration = suite.duration;
      this._currentNode.result = suite.result;
      this._currentNode = this._currentNode.parent;
    });
    return this;
  }

  withTest(test) {
    test.once(Events.TEST_STARTED, () => {
      const newNode = ({ name: test.name, parent: this._currentNode });
      this._currentNode.children.push(newNode);
      this._currentNode = newNode;
    }).once(Events.TEST_FINISHED, () => {
      this._currentNode.duration = test.duration;
      this._currentNode.result = test.result;
      this._currentNode = this._currentNode.parent;
    });
    return this;
  }

  toGraph() {
    return this._currentNode.children;
  }

}

module.exports = GraphReporter;
