# zUnit
[![Node.js CI](https://github.com/acuminous/zUnit/workflows/Node.js%20CI/badge.svg)](https://github.com/acuminous/zUnit/actions?query=workflow%3A%22Node.js+CI%22)
[![NPM version](https://img.shields.io/npm/v/zunit.svg?style=flat-square)](https://www.npmjs.com/package/zunit)
[![NPM downloads](https://img.shields.io/npm/dm/zunit.svg?style=flat-square)](https://www.npmjs.com/package/zunit)
[![Maintainability](https://api.codeclimate.com/v1/badges/6837424f9e1fc6a634bf/maintainability)](https://codeclimate.com/github/acuminous/zUnit/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/6837424f9e1fc6a634bf/test_coverage)](https://codeclimate.com/github/acuminous/zUnit/test_coverage)

## TL;DR
zUnit = goodbits([tape](https://www.npmjs.com/package/tape)) + goodbits([mocha](https://www.npmjs.com/package/mocha)) - dependencies;

## About
zUnit is a zero dependency, non-polluting<sup>[1](#1-non-polluting)</sup>, low magic<sup>[2](#2-low-magic)</sup>, test harness for Node.js that you can execute like any other JavaScript program. I wrote it because [mocha](https://mochajs.org/), my preferred test harness, is the number one culprit for vulnerabilities in my open source projects and I'm tired of updating them just because mocha, or one of its dependencies triggered an audit warning.

Completely reimplementing mocha without dependencies would undoubtedly introduce even more issues. Consequently, zUnit lacks some advanced features, e.g. it does not support concurrent tests, retries or true file globbing, but most of the other day-to-day features are present. Since writing zUnit I've begun to wonder whether these features were necessary in the first place. Many test suites are too small to benefit from parallel testing, and others may need to verify persistence and therefore require effort to isolate. Concurrent testing also has drawbacks - the test harness and reporters become more complex and the output must be buffered, delaying feedback. I'm also unconvinced about automaticaly retrying tests, I think it better to fix any that are flakey, and take a [statistical approach](https://www.npmjs.com/package/fast-stats) when results are naturally unpredictable.

##### 1 non-polluting
You can add test functions (describe, it, etc) to the global namespace if you so wish...
```js
const { syntax } = require('zunit');
Object.entries(syntax).forEach(([keyword, fn]) => global[keyword] = fn);
```
##### 2 low-magic
The only &#x2728;magical&#x2728; code in zUnit is how it automatically exports suites without using `module.exports` by inspecting the call stack.

## Usage
1. Create a runner, e.g. `test/index.js`
    ```js
    const { Harness, Suite, SpecReporter } = require('zunit');

    const suite = new Suite('zUnit').discover();
    const harness = new Harness(suite);

    const interactive = String(process.env.CI).toLowerCase() !== 'true';
    const reporter = new SpecReporter({ colours: interactive });

    harness.run(reporter).then((report) => {
      if (report.failed) process.exit(1);
      if (report.incomplete) {
        console.log(`One or more tests were not run!${EOL}`);
        process.exit(2);
      }
    });
    ```

1. Create a test suite, e.g. `test/user-db.test.js`
    ```js
    const { describe, it, xit, beforeEach } = require('zunit');
    const assert = require('assert');
    const userDb = require('../lib/user-db');

    describe('User DB', () => {

      beforeEach(async () => {
        await userDb.flush();
      })

      describe('List Users', () => {

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
    node tests

    User DB
      List Users
        should list all users
        - PASSED (2ms)
        should list matching use
        - SKIPPED (0ms)

    Summary
      Tests: 2, Passed: 1, Skipped: 1, Failed: 0, Duration: 2ms

    ```

## Discovering Test Suites
zUnit Suites can automatically discover child test suites by invoking their `discover` function. e.g.

```js
  const suite = new Suite('zUnit').discover();
  const harness = new Harness(suite);
```

By default, the discover function will recursively descended into the 'test' directory looking files which end in '.test.js'. You can override this behaviour through the following options.

| Name      | Type                            | Notes                                      |
|-----------|---------------------------------|--------------------------------------------|
| directory | String                          | The initial directory to recurse. Defaults to `path.join(process.cwd(), 'test')` |
| pattern   | Regular Expression              | The pattern to use for matching test files. Defaults to `/^[\w-]+\.test\.js$/` |
| filter    | Function() : Boolean            | Indicates whether a directory should be recursed or a file should be included. Override this if you have directories you want to ignore |

For example:

```js
  const suite = new Suite('zUnit').discover({ directory: __dirname, pattern: /^.+\.test.(?:js|jsx)$/ });
  const harness = new Harness(suite);
```

## Composing Test Suites Explicitly
Instead of automatically discovering test suites, you can compose them explicitly as follows...
```js
const { describe, include } = require('zunit');
const userDbTests = require('./userDbTests');
const productDbTests = require('./productDbTests');

describe('All Tests', () => {
  include(userDbTests, productDbTests)
})
```

You may then wish to change your test runner to be something like this...
```js
const path = require('path');
const { Harness, SpecReporter } = require('zunit');

const filename = path.resolve(__dirname, process.argv[2]);
const suite = require(filename);
const harness = new Harness(suite);

const interactive = String(process.env.CI).toLowerCase() !== 'true';
const reporter = new SpecReporter({ colours: interactive });

harness.run(reporter).then(() => {
  if (harness.failed) process.exit(1);
  if (harness.exclusive) {
    console.log(`Found one or more exclusive tests!`);
    process.exit(2);
  }
});
```

## Callbacks
Sometimes the code under test uses callbacks, making it easier if the test is callback based too. If you define your test functions to take two arguments, the second argument will be passed a callback which you should invoke to signify that the test is done. e.g.

```js
  it('should do something wonderful', (test, done) => {
    callbackApi((err, items) => {
      if (err) return done(err);
      assert.equal(items.length, 0);
      done();
    });
  })
```
Unlike with mocha, you can make the test function asynchronous, allowing you to use `await` when you have a mixture of callback and promise based code in your test.

## Pending / Skipping Tests
You can define pending tests / skip tests in the following ways...

1. Using `xit`
    ```js
    const { describe, xit } = require('zunit');

    describe('My Suite', () => {
      xit('should do something wonderful', async () => {
        // ...
      });
    });
    ```
1. Passing an option to `it`
    ```js
    const { describe, it } = require('zunit');

    describe('My Suite', () => {
      it('should do something wonderful', async () => {
        // ...
      }, { skip: true, reason: 'Optional Reason' });
    });
    ```

1. Using `xdescribe`
    ```js
    const { xdescribe, it } = require('zunit');

    xdescribe('My Suite', () => {
      it('should do something wonderful', async () => {
        // ...
      });
    });
    ```
1. Passing an option to `describe`
    ```js
    const { describe, it } = require('zunit');

    describe('My Suite', () => {
      it('should do something wonderful', async () => {
        // ...
      });
    }, { skip: true, reason: 'Optional Reason' });
    ```

1. Defining a test without a test function
    ```js
    const { describe, it } = require('zunit');

    describe('My Suite', () => {
      it('should do something wonderful');
    });
    ```

1. Returning `test.skip()` from within a test function
    ```js
    const { describe, it } = require('zunit');

    describe('My Suite', () => {
      it('should do something wonderful', async (test) => {
        return test.skip('Optional Reason');
      });
    });
    ```

1. In a beforeEach hook
    ```js
    const { describe, it, beforeEach } = require('zunit');

    describe('My Suite', () => {

      beforeEach(async (hook) => {
        return hook.test.skip('Optional Reason')
      });

      it('should do something wonderful', async (test) => {
        // ...
      });
    });
    ```

1. In a before hook
    ```js
    const { describe, it, before } = require('zunit');

    describe('My Suite', () => {

      before(async (hook) => {
        return hook.suite.skip('Optional Reason')
      });

      it('should do something wonderful', async (test) => {
        // ...
      });
    });
    ```

## Exclusive Tests
You can selectively run tests or suites as follows...

1. Create a dedicated suite
    ```js
    const { describe, include } = require('zunit');
    const homePageTests = require('./frontend/profile-page.test');
    const settingsPageTests = require('./frontend/settings-page.test');
    const searchPageTests = require('./frontend/search-page.test');

    describe('Frontend Tests', () => {
      include(homePageTests, settingsPageTests, searchPageTests);
    });
    ```

1. Using `oit`
    ```js
    const { describe, oit } = require('zunit');

    describe('My Suite', () => {
      oit('should do something wonderful', async () => {
        // ...
      });
    });
    ```

1. Passing an option to `it`
    ```js
    const { describe, it } = require('zunit');

    describe('My Suite', () => {
      it('should do something wonderful', async () => {
        // ...
      }, { exclusive: true });
    });
    ```

1. Using `odescribe`
    ```js
    const { odescribe, it } = require('zunit');

    odescribe('My Suite', () => {
      it('should do something wonderful', async () => {
        // ...
      });
    });
    ```

1. Passing an option to `describe` (affects all tests in the enclosing and included suites)
    ```js
    const { describe, it } = require('zunit');

    describe('My Suite', () => {
      it('should do something wonderful', async () => {
        // ...
      });
    }, { exclusive: true });
    ```

## Timeouts
Tests default to timing out after 5 seconds. You can override this as follows...

1. Passing a timeout option when running the main suite
    ```js
    runnable.run(reporter, { timeout: 10000 }).then(() => {
      if (runnable.failed) process.exit(1);
    });
    ```

1. Passing a timeout option to `it`
    ```js
    const { describe, it } = require('zunit');

    describe('My Suite', () => {
      it('should do something wonderful', async () => {
        // ...
      }, { timeout: 10000 });
    });
    ```

1. Passing a timeout option to `describe` (affects all tests in the suite)
    ```js
    const { describe, it } = require('zunit');

    describe('My Suite', () => {
      it('should do something wonderful', async () => {
        // ...
      });
    }, { timeout: 10000 });
    ```

The timeout includes the duration of beforeEach/afterEach [lifecycle hooks](#lifecycle-hooks), although these may also have their own timeouts.

## Bailing Out / Failing Fast / Aborting Early
Test suites continue running tests after failure by default. You can override this in the following ways...

1. Passing an abort option when running the main suite
    ```js
    runnable.run(reporter, { abort: true }).then(() => {
      if (runnable.failed) process.exit(1);
    });
    ```

1. Passing an option to `describe`
    ```js
    const { describe, it } = require('zunit');

    describe('My Suite', () => {
      it('should do something wonderful', async () => {
        // ...
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
const { describe, before, after, beforeEach, afterEach, it } = require('zunit');

describe('Suite', () => {

  before(async (hook) => {
    console.log(hook.name)
  });

  beforeEach(async (hook) => {
    console.log(hook.name)
  });

  after(async (hook) => {
    console.log(hook.name)
  });

  afterEach(async (hook) => {
    console.log(hook.name)
  });

  it('Test 1', async () => {
  });

  it('Test 2', async () => {
  });

  describe('Nested Suite', () => {

    before(async (hook) => {
      console.log(hook.name)
    });

    beforeEach(async (hook) => {
      console.log(hook.name)
    });

    after(async (hook) => {
      console.log(hook.name)
    });

    afterEach(async (hook) => {
      console.log(hook.name)
    });

    it('Nested Test 1', async () => {
    });

    it('Nested Test 2', async () => {
    })
  });

});
```

You can explicitly name hooks by passing a string as the first parameter, e.g. `beforeEach('Reset', async (h) => { ... })` and skip a test from a before hook by calling `hook.suite.skip('optional reason)` and from a beforeEach hook by calling `hook.test.skip('optional reason')`;

As with tests you can enable callback mode by adding a second paramter to any lifecycle's hook function, e.g.
```js
before((hook, done) => {
  callbackApi((err) => {
    if (err) return done(err);
    done();
  });
});
```
The function may still be `async` if you need to mix and match promises and callbacks.

Finally you can specify a timeout for any lifecycle hook af follows...
```js
before(async (hook) => {
  // ...
}, { timeout: 1000 });
```

Timeouts for before/after hooks are independent of test timeouts, but timeouts for beforeEach/afterEach operate within the test's timeout and so must be shorter if they are to be of any use.

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
| result   | String                          | One of Outcomes                        |
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
<testsuites name="zUnit" tests="45" failures="0" time="0.714">
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
zUnit
  Harnesses
    should run a test suite
     - PASSED (4ms)
    should run an individual test
     - PASSED (2ms)

Summary
  Tests: 2, Passed: 2, Failed: 0, Skipped: 0, Duration: 6ms
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
const { Hook, Suite, Test } = require('zunit');

const reset = new Hook('Reset Environment', () => {
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
It can be annoying to repeatedly add and remove syntax related imports in your tests. You can exclude these from eslint's no-unused-vars rule with the following config...
```json
{
  "rules": {
    "no-unused-vars": [
      "error", {
        "varsIgnorePattern": "it|xit|oit|describe|xdescribe|odescribe|before|beforeEach|after|afterEach|include"
      }
    ]
  }
}
```
Alternatively, if you are [using globals](#1-non-polluting) then you should tell eslint to ignore them...
```json
{
  "globals": {
    "describe": "readonly",
    "xdescribe": "readonly",
    "odescribe": "readonly",
    "it": "readonly",
    "xit": "readonly",
    "oit": "readonly",
    "before": "readonly",
    "beforeEach": "readonly",
    "after": "readonly",
    "afterEach": "readonly",
    "include": "readonly"
  }
}
```

