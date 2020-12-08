const TestableEvents = require('../TestableEvents');
const TestableOutcomes = require('../TestableOutcomes');
const appendAll = require('../utils/appendAll');

class GraphReporter {

  constructor(name = 'root') {
    this._currentNode = new GraphNode(name);
  }

  withHarness() {
    return this;
  }

  withSuite(suite) {
    suite.once(TestableEvents.STARTED, () => {
      const childNode = new GraphNode('suite', suite.name, suite.description, undefined, this._currentNode);
      this._currentNode.add(childNode);
      this._currentNode = childNode;
    });
    suite.once(TestableEvents.FINISHED, () => {
      this._currentNode.finish(suite);
      this._currentNode = this._currentNode.parent;
    });
    return this;
  }

  withTest(test) {
    test.once(TestableEvents.STARTED, () => {
      const childNode = new GraphNode('test', test.name, test.description, test.point, this._currentNode);
      this._currentNode.add(childNode);
      this._currentNode = childNode;
    }).once(TestableEvents.FINISHED, () => {
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
    return this.result === TestableOutcomes.PASSED;
  }

  get failed() {
    return this.result === TestableOutcomes.FAILED;
  }

  get skipped() {
    return this.result === TestableOutcomes.SKIPPED;
  }

  resolve(...indexes) {
    return indexes.reduce((node, index) => {
      return node.children[index];
    }, this);
  }

  add(...additions) {
    this.children = appendAll(this.children, additions);
    return this;
  }

  finish({ result, error, reason, duration, stats }) {
    this.result = result;
    this.error = error;
    this.reason = reason;
    this.duration = duration;
    this.stats = stats;
  }

  _orphan() {
    const node = new GraphNode(this.type, this.name, this.description, this.point);
    node.add(this.children);
    node.finish({
      result: this.result,
      error: this.error,
      reason: this.reason,
      duration: this.duration,
      stats: this.stats,
    });
    return node;
  }
}

module.exports = GraphReporter;
