const RunnableEvents = require('../RunnableEvents');
const RunnableOutcomes = require('../RunnableOutcomes');

class GraphReporter {

  constructor(name = 'root') {
    this._currentNode = new GraphNode(name);
  }

  withHarness() {
    return this;
  }

  withSuite(suite) {
    suite.once(RunnableEvents.STARTED, () => {
      const childNode = new GraphNode('suite', suite.name, suite.description, undefined, this._currentNode);
      this._currentNode.add(childNode);
      this._currentNode = childNode;
    });
    suite.once(RunnableEvents.FINISHED, () => {
      this._currentNode.finish(suite);
      this._currentNode = this._currentNode.parent;
    });
    return this;
  }

  withTest(test) {
    test.once(RunnableEvents.STARTED, () => {
      const childNode = new GraphNode('test', test.name, test.description, test.point, this._currentNode);
      this._currentNode.add(childNode);
      this._currentNode = childNode;
    }).once(RunnableEvents.FINISHED, () => {
      this._currentNode.finish(test);
      this._currentNode = this._currentNode.parent;
    });
    return this;
  }

  toGraph() {
    return this._currentNode.children[0]._orphan();
  }
}

class GraphNode {
  constructor(type, name, description, point, parent) {
    this.type = type;
    this.name = name;
    this.description = description;
    this.point = point;
    this.parent = parent;
    this.children = [];
  }

  isSuite() {
    return this.type === 'suite';
  }

  isTest() {
    return this.type === 'test';
  }

  get passed() {
    return this.result === RunnableOutcomes.PASSED;
  }

  get failed() {
    return this.result === RunnableOutcomes.FAILED;
  }

  get skipped() {
    return this.result === RunnableOutcomes.SKIPPED;
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

  finish({ result, error, reason, stats, duration }) {
    this.result = result;
    this.error = error;
    this.reason = reason;
    this.stats = stats;
    this.duration = duration;
  }

  _orphan() {
    const node = new GraphNode(this.type, this.name, this.description, this.point);
    node.add(this.children);
    node.finish({
      result: this.result,
      error: this.error,
      reason: this.reason,
      stats: this.stats,
      duration: this.duration,
    });
    return node;
  }
}

module.exports = GraphReporter;
