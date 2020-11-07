const RunnableEvents = require('../RunnableEvents');

class GraphReporter {

  constructor(name = 'root') {
    this._currentNode = new GraphNode(name);
  }

  withHarness() {
    return this;
  }

  withSuite(suite) {
    suite.once(RunnableEvents.STARTED, () => {
      const childNode = new GraphNode(suite.name, undefined, this._currentNode);
      this._currentNode.add(childNode);
      this._currentNode = childNode;
    });
    suite.once(RunnableEvents.FINISHED, () => {
      this._currentNode.finish(suite.result, suite.duration);
      this._currentNode = this._currentNode.parent;
    });
    return this;
  }

  withTest(test) {
    test.once(RunnableEvents.STARTED, () => {
      const childNode = new GraphNode(test.name, test.number, this._currentNode);
      this._currentNode.add(childNode);
      this._currentNode = childNode;
    }).once(RunnableEvents.FINISHED, () => {
      this._currentNode.finish(test.result, test.duration);
      this._currentNode = this._currentNode.parent;
    });
    return this;
  }

  toGraph() {
    return this._currentNode.children[0].orphan();
  }
}

class GraphNode {
  constructor(name, number, parent) {
    this.name = name;
    this.number = number;
    this.parent = parent;
    this.children = [];
  }

  resolve(...indexes) {
    return indexes.reduce((node, index) => {
      return node.children[index];
    }, this);
  }

  add(...additions) {
    this.children = additions.reduce((children, child) => {
      return children.concat(child);
    }, this.children);
    return this;
  }

  finish(result, duration) {
    this.result = result;
    this.duration = duration;
  }

  orphan() {
    const node = new GraphNode(this.name, this.number);
    node.add(this.children);
    node.finish(this.result, this.duration);
    return node;
  }
}

module.exports = GraphReporter;
