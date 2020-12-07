# zUnit
zUnit is a zero dependency, non-polluting, low magic, test harness for Node.js that you can execute like any other JavaScript program. I wrote it because [mocha](https://mochajs.org/), my preferred test harness, is the number one culprit for vulnerabilities in my open source projects and I'm tired of updating them just because one of mocha's dependencies triggered an audit warning.

Completely reimplementing mocha without dependencies would likely introduce even more issues. Consequently, zUnit lacks some advanced features, e.g. it does not support concurrent tests, retries or test discovery, but most of the other day-to-day features are present. Since writing zUnit I've begun to wonder whether these features were necessary in the first place. Many projects test suites are too small to benefit from concurrent testing, yet it's use means output must be buffered, delaying feedback. Rather than retrying tests, I think it better to fix any that are flakey, and take a [statistical approach](https://www.npmjs.com/package/fast-stats) when results are somewhat unpredictable.

## TL;DR

1. Create a runner, e.g. `tests/index.js`
    ```js
    const path = require('path');
    const { EOL } = require('os');
    const { Harness, MultiReporter, SpecReporter } = require('zunit');

    const filename = path.resolve(__dirname, process.argv[2]);
    const suite = require(filename);
    const harness = new Harness(suite);

    const interactive = String(process.env.CI).toLowerCase() !== 'true';

    const reporter = new MultiReporter()
      .add(new SpecReporter({ colours: interactive }));

    harness.run(reporter).then(() => {
      if (harness.failed) process.exit(1);
      if (harness.hasExclusiveTests()) {
        console.log(`Found one or more exclusive tests!${EOL}`);
        process.exit(2);
      }
    });
    ```

1. Create a test suite, e.g. `tests/user-db.test.js`
    ```js
    const { describe } = require('zunit');
    const assert = require('assert');
    const userDb = require('../lib/user-db');

    describe('User DB', ({ beforeEach, describe }) => {

      beforeEach(async () => {
        await userDb.flush();
      })

      describe('List Users', ({ it, xit }) => {

        it('should list all users', async () => {
          await userDb.create({ name: 'John' });
          await userDb.create({ name: 'Julie' });

          const users = await userDb.list();
          assert.equal(users.length, 2);
          assert.equal(users[0].name, 'John');
          assert.equal(users[1].name, 'Julie');
        });

        xit('should list matching users', async () => {
        });
      })
    });
    ```

1. Run the tests
    ```bash
    node tests user-db.test.js

    User DB
      List Users
        should list all users
        - PASSED (2ms)
        should list matching use
        - SKIPPED (0ms)

    Summary
      Passed: 1, Skipped: 1, Failed: 0, Duration: 2ms

    ```

## Composing Test Suites
Because zUnit doesn't walk the filesystem to discover tests suites, you need to define them explicitly. This easiest way of doing this is by creating an main suite and including others from it. e.g.

```js
const userDbTests = require('./userDbTests');
const productDbTests = require('./productDbTests');

describe('All Tests', ({ include }) => {
  include(userDbTests, productDbTests)
})
```

## Pending / Skipping Tests
You can define pending tests / skip tests in the following ways...

1. Using `xit`
    ```js
    const { describe } = require('zunit');

    describe('My Suite', ({ xit }) => {
      xit('should do something wonderful', async () => {
      });
    });
    ```
1. Using `xdescribe`
    ```js
    const { xdescribe } = require('zunit');

    xdescribe('My Suite', ({ it }) => {
      it('should do something wonderful', async () => {
      });
    });
    ```

1. Defining a test without a test function
    ```js
    const { describe } = require('zunit');

    describe('My Suite', ({ it }) => {
      it('should do something wonderful');
    });
    ```

1. Returning `test.skip()` from within a test function
    ```js
    const { describe } = require('zunit');

    describe('My Suite', ({ it }) => {
      it('should do something wonderful', async (test) => {
        return test.skip();
      });
    });
    ```

## Exclusive Tests
You can selectively run tests or suites as follows...

1. Create a dedicated suite
    ```js
    const { describe } = require('zunit');
    const homePageTests = require('./frontend/profile-page.test');
    const settingsPageTests = require('./frontend/settings-page.test');
    const searchPageTests = require('./frontend/search-page.test');

    describe('Frontend Tests', ({ it, include }) => {
      include(homePageTests, settingsPageTests, searchPageTests);
    });
    ```

1. Passing an option to `it`
    ```js
    const { describe } = require('zunit');

    describe('My Suite', ({ it }) => {
      it('should do something wonderful', async () => {
      }, { exclusive: true });
    });
    ```

1. Passing an option to `describe` (affects all tests in the enclosing and included suites)
    ```js
    const { describe } = require('zunit');

    describe('My Suite', ({ it }) => {
      it('should do something wonderful', async () => {
      });
    }, { exclusive: true });
    ```

## Timeouts
Tests default to timing out after 5 seconds. You can override this as follows...

1. Passing a timeout option when running the main suite
    ```js
    runnable.run(reporter, { timeout: 10000 }).then(() => {
      if (runnable.failed) process.exit(1);
    })
    ```

1. Passing a timeout option to `it`
    ```js
    const { describe } = require('zunit');

    describe('My Suite', ({ it }) => {
      it('should do something wonderful', async () => {
      }, { timeout: 10000 });
    });
    ```

1. Passing a timeout option to `describe` (affects all tests in the suite)
    ```js
    const { describe } = require('zunit');

    describe('My Suite', ({ it }) => {
      it('should do something wonderful', async () => {
      });
    }, { timeout: 10000 });
    ```

The timeout includes the duration of all [lifecycle hooks](#lifecyclehooks).

## Bailing Out / Failing Fast / Aborting Early
Test suites continue running tests after failure by default. You can override this in the following ways...

1. Passing an abort option when running the main suite
    ```js
    runnable.run(reporter, { abort: true }).then(() => {
      if (runnable.failed) process.exit(1);
    })
    ```

1. Passing an option to `describe`
    ```js
    const { describe } = require('zunit');

    describe('My Suite', ({ it }) => {
      it('should do something wonderful', async () => {
      });
    }, { abort: true });
    ```

## Lifecycle Hooks

* before - runs once before the first test in the enclosing and included suites
* after - runs once after the last test in the enclosing and included suites
* beforeEach - runs before each test in the enclosing and included suites
* afterEach - runs after each test in the enclosing and included suites

This is best demonstrated with an example
```js
const { describe } = require('zunit');

describe('Suite', ({ before, after, beforeEach, afterEach, describe, it }) => {

  before(async (h) => {
    console.log(h.name)
  })

  beforeEach(async (h) => {
    console.log(h.name)
  })

  after(async (h) => {
    console.log(h.name)
  })

  afterEach(async (h) => {
    console.log(h.name)
  })

  it('Test 1', async () => {
  })

  it('Test 2', async () => {
  })

  describe('Nested Suite', ({ before, after, beforeEach, afterEach, it }) => {

    before(async (h) => {
      console.log(h.name)
    })

    beforeEach(async (h) => {
      console.log(h.name)
    })

    after(async (h) => {
      console.log(h.name)
    })

    afterEach(async (h) => {
      console.log(h.name)
    })

    it('Nested Test 1', async () => {
    })

    it('Nested Test 2', async () => {
    })
  });

})
```
You can explicitly name hooks by passing a string as the first parameter, e.g. `beforeEach('Reset', async (h) => { ... })` and skip a test from a before hook by calling `h.test.skip()`;

## Reporters
zUnit ships with the following reporters

* [GraphReporter](#graphreporter)
* [JUnitReporter](#junitreporter)
* [MultiReporter](#multireporter)
* [SpecReporter](#specreporter)
* [TapReporter](#tapreporter)

### GraphReporter
This reporter builds up a graph of test results for subsequent interogation.

#### Usage
```js
const reporter = new GraphReporter();
await harness.run(reporter);
const graph = reporter.toGraph();
```

Each node in the graph has the following properties

| Name     | Type                            | Notes                                  |
|----------|---------------------------------|----------------------------------------|
| name     | String                          | The node name                          |
| type     | String                          | The node type (`test` or `suite`)      |
| isTest   | Function() : Boolean            | Indicates whether the node is a test   |
| isSuite  | Function() : Boolean            | Indicates whether the node is a suite  |
| point    | Number                          | The test point number (undefined for suites) |
| result   | String                          | One of TestableOutcomes                |
| passed   | Boolean                         | Indicates wither the node passed       |
| failed   | Boolean                         | Indicates wither the node failed       |
| skipped  | Boolean                         | Indicates wither the node skipped      |
| error    | Error                           | Populated if the test fails            |
| duration | Number                          | Milliseconds                           |
| tests    | Number                          | Number of tests                        |
| failures | Number                          | Number of failures                     |
| skips    | Number                          | Number of skipped tests                |
| children | Array&lt;GraphNode&gt;          | Array of child nodes                   |
| parent   | GraphNode                       | Parent node                            |
| resolve  | Function(...Number) : GraphNode | Resolves the specified child, e.g. `.resolve(1, 2, 3)` |

### JUnitReporter
A [JUnit](https://llg.cubic.org/docs/junit/) Reporter

```js
const reporter = new JunitReporter();
await harness.run(reporter);
```

#### Options
| Option  | Type            | Default | Notes           |
|---------|-----------------|---------|-----------------|
| stream  | stream.Writable | stdout  | Override to redirect output |

#### Sample Output
```bash
<?xml version="1.0" encoding="UTF-8" ?>
<testsuites name="ZUnit" tests="45" failures="0" time="0.714">
  <testsuite name="Harnesses" tests="7" failures="0" skipped="0" time="0.023">
    <testcase name="should run a test suite" time="0.005">
    </testcase>
    <testcase name="should run an individual test" time="0.002">
    </testcase>
  </testsuite>
</testsuites>
```
It is necessary to take some liberties with the JUnit format since:

- it was designed for Java and expects package / class names rather than suite / test names
- it differentiates between assertion failures and errors
- it does not support deep nesting

### MultiReporter
Pipes test events to multiple reporters

#### Usage
```js
const specReporter = new SpecReporter();
const tapReporter = new TapReporter({ stream: fileStream });
const multiReporter = new MultiReporter().add(specReporter, tapReporter);
await harness.run(reporter);
```

### SpecReporter
Similar to mocha's spec reporter

#### Usage
```js
const reporter = new SpecReporter(options);
await harness.run(reporter);
```

#### Sample Output
```bash
ZUnit
  Harnesses
    should run a test suite
     - PASSED (4ms)
    should run an individual test
     - PASSED (2ms)

Summary
  Passed: 2, Failed: 0, Skipped: 0, Duration: 6ms
```

#### Options
| Option  | Type            | Default | Notes                       |
|---------|-----------------|---------|-----------------------------|
| stream  | stream.Writable | stdout  | Override to redirect output |
| colours | Boolean         | true    | Toggles colours             |
| colors  | Boolean         | true    | Alias for colours           |

### TapReporter
A [TAP](https://testanything.org/tap-version-13-specification.html) Reporter

```js
const reporter = new TapReporter();
await harness.run(reporter);
```

#### Options
| Option  | Type            | Default | Notes           |
|---------|-----------------|---------|-----------------|
| stream  | stream.Writable | stdout  | Override to redirect output |

#### Sample Output
```bash
TAP version 13
1..2
ok 1 - Harnesses / should run a test suite
ok 2 - Harnesses / should run an individual test
```

## Creating suites and tests by hand
There's no need to use `describe` and `it` if you prefer not to. You can just as easily create test suites as follows...
```js
const assert = require('assert');
const { Before, Suite, Test } = require('zunit');

const reset = new Before('Reset Environment', () => {
  // ...
});

const suite = new Suite('Test Suite').beforeEach(reset);
const test1 = new Test('Test 1', async () => {
  assert.equal(1, 2);
});
const test2 = new Test('Test 2', async () => {
  assert.equal(1, 2);
});
suite.add(test1, test2);

module.exports = suite;
```
Both the `Suite` and `Test` constructors accept an optional `options` object which can be used for aborting early, skipping tests or making them exclusive. e.g.
```js
const suite = new Suite('Test Suite', { abort: true, skip: true });
const test = new Test('Test 1', { exclusive: true });
```

## Tips

### eslint
It can be annoying to repeatedly add and remove `xit` and `xdescribe` imports in your tests. You can exclude these from eslint's no-unused-vars rule with the following config...
```json
{
  "rules": {
    "no-unused-vars": [
      "error", {
        "varsIgnorePattern": "xit|xdescribe"
      }
    ]
  }
}
```

