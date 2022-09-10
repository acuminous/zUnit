# zUnit

[![Node.js CI](https://github.com/acuminous/zUnit/workflows/Node.js%20CI/badge.svg)](https://github.com/acuminous/zUnit/actions?query=workflow%3A%22Node.js+CI%22)
[![NPM version](https://img.shields.io/npm/v/zunit.svg?style=flat-square)](https://www.npmjs.com/package/zunit)
[![NPM downloads](https://img.shields.io/npm/dm/zunit.svg?style=flat-square)](https://www.npmjs.com/package/zunit)
[![Maintainability](https://api.codeclimate.com/v1/badges/6837424f9e1fc6a634bf/maintainability)](https://codeclimate.com/github/acuminous/zUnit/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/6837424f9e1fc6a634bf/test_coverage)](https://codeclimate.com/github/acuminous/zUnit/test_coverage)
[![Discover tripitaka](https://img.shields.io/badge/Discover-tripitaka-brightgreen)](https://www.npmjs.com/package/tripitaka)

## TL;DR

zUnit = goodbits([tape](https://www.npmjs.com/package/tape)) + goodbits([mocha](https://www.npmjs.com/package/mocha)) - dependencies;

## Index

- [About](#about)
- [Usage](#usage)
- [Configuration](#configuration)
- [Callbacks](#callbacks)
- [Pending / Skipping Tests](#pending--skipping-tests)
- [Exclusive Tests](#exclusive-tests)
- [Bailing Out / Failing Fast / Aborting Early](#bailing-out--failing-fast--aborting-early)
- [Lifecycle Hooks](#lifecycle-hooks)
- [Locals](#locals)
- [Reporters](#reporters)
- [Tips](#tips)
- [Credits](#credits)

## About

zUnit is a zero dependency<sup>[1](#1-zero-dependency)</sup>, non-polluting<sup>[2](#2-non-polluting)</sup> test harness for Node.js that you can execute like any other JavaScript program. I wrote it because [mocha](https://mochajs.org/), my preferred test harness, is the number one culprit for vulnerabilities in my open source projects and I'm tired of updating them just because mocha, or one of its dependencies triggered an audit warning. While zUnit does lack some of the advanced features, such as concurrent tests, automatic retries and true file globbing<sup>[3](#3-advanced-features)</sup>, most of the day-to-day features are present.

##### 1 zero-dependency

zUnit has no production dependencies, but does depend on a few development dependencies such as eslint and prettier.

##### 2 non-polluting

You can add test functions (describe, it, etc) to the global namespace via the [pollute](#config) config option.

##### 3 advanced-features

Since writing zUnit I've begun to wonder whether some of Mocha's advanced features are universally beneficial. Many test suites are too small to warrant concurrency, and others (e.g. persistence tests) may require a great deal of effort to isolate. Concurrent testing also has drawbacks - the test harness and reporters become more complex and the output must be buffered, delaying feedback. I'm also unconvinced about automaticaly retrying tests, I think it better to fix any that are flakey, and take a [statistical approach](https://www.npmjs.com/package/fast-stats) when results are naturally unpredictable.

## Usage

1. Install zUnit
   ```
   npm i zunit --save-dev
   ```
1. Add the zUnit script to package.json
   ```json
   {
     "scripts": {
       "test": "zUnit"
     }
   }
   ```
1. Create a test suite, e.g. `test/user-db.test.js`

   ```js
   const { describe, it, xit, beforeEach } = require('zunit');
   const assert = require('assert');
   const userDb = require('../lib/user-db');

   describe('User DB', () => {
     beforeEach(async () => {
       await userDb.flush();
     });

     describe('List Users', () => {
       it('should list all users', async () => {
         await userDb.create({ name: 'John' });
         await userDb.create({ name: 'Julie' });

         const users = await userDb.list();
         assert.strictEqual(users.length, 2);
         assert.strictEqual(users[0].name, 'John');
         assert.strictEqual(users[1].name, 'Julie');
       });

       xit('should list matching users', async () => {});
     });
   });
   ```

1. Run the tests

   ```
   npm test

   User DB
     List Users
       should list all users
        - PASSED (2ms)
       should list matching use
        - SKIPPED (0ms)

   Summary
     Tests: 2, Passed: 1, Skipped: 1, Failed: 0, Duration: 2ms

   ```

## Configuration

You can configure zUnit's launch script by:

1. Specifying a configuration file when invoking the script, e.g.
   ```json
   {
     "scripts": {
       "test": "zUnit test/zUnit.json"
     }
   }
   ```
1. Adding a `zUnit` subdocument to package.json, e.g.
   ```json
   {
     "zUnit": {
       "exit": true,
       "pollute": true,
       "require": ["test/setup.js"]
     }
   }
   ```
1. Creating a file called `.zUnit.json` or `.zUnit.js` in the project root

### Configuration options

| Name      | Type             | Default                | Notes                                                                                                  |
| --------- | ---------------- | ---------------------- | ------------------------------------------------------------------------------------------------------ |
| name      | String           | `package.name`         | The top level suite name.                                                                              |
| directory | String           | `path.resolve('test')` | The initial directory to recurse when requiring tests.                                                 |
| pattern   | String or RegExp | `/^[\w-]+\.test\.js$/` | The regular expression to use for matching test files. Omit the start and end slashes when using json  |
| require   | Array            | `[]`                   | A list of mjs or cjs modules to require before discovering tests.                                                 |
| pollute   | Boolean          | `false`                | Control whether to pollute the global namespace with test functions so you don't have to require them. |
| exit      | Boolean          | `false`                | For the node process to exit after tests are complete.                                                 |

## Writing your own launch script

If the packaged [launch script](<[script](https://github.com/acuminous/cryptus/blob/master/bin/zUnit.js)>) doesn't meet your needs you can create your own. For example, you may want to use a different reporter...

```js
const { EOL } = require('os');
const { Harness, Suite, TapReporter } = require('zunit');

new Suite('zUnit').discover().then((suite) => {
  const harness = new Harness(suite);
  const reporter = new TapReporter();

  harness.run(reporter).then((report) => {
    if (report.failed) process.exit(1);
    if (report.incomplete) {
      console.log(`One or more tests were not run!${EOL}`);
      process.exit(2);
    }
    process.exit();
  });
});
```

### Discovering Test Suites

zUnit suites can automatically discover child test suites by invoking their `discover` function. e.g.

```js
new Suite('zUnit').discover().then((suite) => {
  const harness = new Harness(suite);
});
```

By default, the discover function will recursively descended into the 'test' directory looking files which end in '.test.js'. You can override this behaviour through the following options.

| Name      | Type                 | Default                | Notes                                                                                                                                   |
| --------- | -------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| directory | String               | `path.resolve('test')` | The initial directory to recurse when requiring tests.                                                                                  |
| pattern   | Regular Expression   | `/^[\w-]+\.test\.js$/` | The regular expression to use for matching test files.                                                                                  |
| filter    | Function() : Boolean |                        | Indicates whether a directory should be recursed or a file should be included. Override this if you have directories you want to ignore |

For example:

```js
new Suite('zUnit').discover({ directory: __dirname, pattern: /^.+\.test.(?:js|jsx)$/ }).then((suite) => {
  const harness = new Harness(suite);
});
```

### Composing Test Suites Explicitly

You can compose test suites explicitly by exporting your test modules and including them...

```js
module.export = describe('User DB', () => {
  // ...
});
```

```js
module.export = describe('Product DB tests', () => {
  // ...
});
```

```js
const userDbTests = require('./userDbTests');
const productDbTests = require('./productDbTests');

describe('All Tests', () => {
  include(userDbTests, productDbTests);
});
```

You can then selectively run test suites by updating your launch script to be something like this...

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
const { describe, it } = require('zunit');

it('should do something wonderful', (test, done) => {
  callbackApi((err, items) => {
    if (err) return done(err);
    assert.strictEqual(items.length, 0);
    done();
  });
});
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
     it(
       'should do something wonderful',
       async () => {
         // ...
       },
       { skip: true, reason: 'Optional Reason' }
     );
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

   describe(
     'My Suite',
     () => {
       it('should do something wonderful', async () => {
         // ...
       });
     },
     { skip: true, reason: 'Optional Reason' }
   );
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
       return hook.test.skip('Optional Reason');
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
       return hook.suite.skip('Optional Reason');
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
     it(
       'should do something wonderful',
       async () => {
         // ...
       },
       { exclusive: true }
     );
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

   describe(
     'My Suite',
     () => {
       it('should do something wonderful', async () => {
         // ...
       });
     },
     { exclusive: true }
   );
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
     it(
       'should do something wonderful',
       async () => {
         // ...
       },
       { timeout: 10000 }
     );
   });
   ```

1. Passing a timeout option to `describe` (affects all tests in the suite)

   ```js
   const { describe, it } = require('zunit');

   describe(
     'My Suite',
     () => {
       it('should do something wonderful', async () => {
         // ...
       });
     },
     { timeout: 10000 }
   );
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

   describe(
     'My Suite',
     () => {
       it('should do something wonderful', async () => {
         // ...
       });
     },
     { abort: true }
   );
   ```

## Lifecycle Hooks

- before - runs once before the first test in the enclosing and included suites
- after - runs once after the last test in the enclosing and included suites
- beforeEach - runs before each test in the enclosing and included suites
- afterEach - runs after each test in the enclosing and included suites

This is best demonstrated with an example

```js
const { describe, before, after, beforeEach, afterEach, it } = require('zunit');

describe('Suite', () => {
  before(async (hook) => {
    console.log(hook.name);
  });

  beforeEach(async (hook) => {
    console.log(hook.name);
  });

  after(async (hook) => {
    console.log(hook.name);
  });

  afterEach(async (hook) => {
    console.log(hook.name);
  });

  it('Test 1', async () => {});

  it('Test 2', async () => {});

  describe('Nested Suite', () => {
    before(async (hook) => {
      console.log(hook.name);
    });

    beforeEach(async (hook) => {
      console.log(hook.name);
    });

    after(async (hook) => {
      console.log(hook.name);
    });

    afterEach(async (hook) => {
      console.log(hook.name);
    });

    it('Nested Test 1', async () => {});

    it('Nested Test 2', async () => {});
  });
});
```

### Reporting Before/After Hook Failures

When a Before hook fails, the tests are not run, and therefore denied opportunity to pass or fail. This means there will be a discrepancy in the stats (i.e. tests != passed + failed). In this case the harness report will be marked as incomplete and failed.

When an After hook fails, the tests have run, so there will be no discrepancy in the test stats, and the harness report will not be marked as incomplete, but will still be failed.

Some report specifications such as [TAP](https://testanything.org/tap-version-13-specification.html) and [Surefire](https://maven.apache.org/surefire/maven-surefire-plugin/xsd/surefire-test-report-3.0.xsd) have no concept of hooks, and therefore do not have a sensible mechanism for reporting their failure. It is therefore important to always check the result of the harness report, i.e.

```js
const reporter = new TapReporter();

harness.run(reporter).then((report) => {
  if (report.failed) process.exit(1);
  if (report.incomplete) {
    console.log('One or more tests were not run!');
    process.exit(2);
  }
});
```

### Advanced Usage

You can explicitly name hooks by passing a string as the first parameter. You can also skip a suite from a before hook, and a test from a beforeEach hook. e.g.

```js
before('Suite Setup', (hook) => {
  hook.suite.skip('optional reason');
});

beforeEach('Test Setup', (hook) => {
  hook.test.skip('optional reason');
});
```

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
before(
  async (hook) => {
    // ...
  },
  { timeout: 1000 }
);
```

Timeouts for before/after hooks are independent of test timeouts, but timeouts for beforeEach/afterEach operate within the test's timeout and so must be shorter if they are to be of any use.

## Locals

It is sometimes necessary to initialise a variable in a `before` or `beforeEach` function, which is subsequently used from your tests. The typical approach is as follows...

```js
describe('Database Tests', () => {
  let db;

  before(async () => {
    db = await Databaes.connect();
  });

  it('should find no records when empty', async () => {
    const records = await db.findAll();
    assert.strictEqual(records.length, 0);
  });
});
```

This is fine providing your tests are declared within the same module as the variable, but occasionally they may not be. You could for example have a shared set of compliance tests for different database implementations, and therefore need a way to inject the database client into those tests. This is where Locals come in. In zUnit, locals is an object with three public methods

- locals.get('name');
- locals.set('name', value);
- locals.del('name');

It is a property of both suite and test objects available at runtime, i.e.

```js
before((hook) => {
  hook.suite.locals.set('a', 1);
});

beforeEach((hook) => {
  hook.test.locals.set('b', 2);
});

it('some test', (test) => {
  assert.strictEqual(test.locals.get('a'), 1);
  assert.strictEqual(test.locals.get('b'), 2);
});
```

Using locals, the previous database test can be rewritten as...

```js
describe('Database Tests', () => {
  before(async (hook) => {
    const db = await Databaes.connect();
    hook.suite.locals.set('db', db);
  });

  it('should find no records when empty', async (test) => {
    const db = test.locals.get('db');
    const records = await db.findAll();
    assert.strictEqual(records.length, 0);
  });
});
```

Locals also support nesting...

```js
describe('Outer Suite', () => {
  before((hook) => {
    hook.suite.locals.set('a', 1);
    hook.suite.locals.set('b', 1);
  });

  describe('Nested Suite', () => {
    before((hook) => {
      hook.suite.locals.set('b', 2);
      hook.suite.locals.set('c', 3);
    });

    it('should access outer locals', async (test) => {
      assert.strictEqual(test.locals.get('a'), 1);
    });

    it('should mask outer locals', async (test) => {
      assert.strictEqual(test.locals.get('b'), 2);
    });

    it('should access nested locals', async (test) => {
      assert.strictEqual(test.locals.get('c'), 3);
    });
  });
});
```

Nested locals only mask values in upper scopes. They do not replace or delete them.

## Reporters

zUnit ships with the following reporters

- [GraphReporter](#graphreporter)
- [SurefireReporter](#surefirereporter)
- [MultiReporter](#multireporter)
- [SpecReporter](#specreporter)
- [TapReporter](#tapreporter)
- [RickReporter](https://www.youtube.com/watch?v=dQw4w9WgXcQ)

### GraphReporter

This reporter builds up a graph of test results for subsequent interogation.

#### Usage

```js
const reporter = new GraphReporter();
await harness.run(reporter);
const graph = reporter.toGraph();
```

Each node in the graph has the following properties

| Name     | Type                            | Notes                                                  |
| -------- | ------------------------------- | ------------------------------------------------------ |
| name     | String                          | The node name                                          |
| type     | String                          | The node type (`test` or `suite`)                      |
| isTest   | Function() : Boolean            | Indicates whether the node is a test                   |
| isSuite  | Function() : Boolean            | Indicates whether the node is a suite                  |
| point    | Number                          | The test point number (undefined for suites)           |
| result   | String                          | One of Outcomes                                        |
| passed   | Boolean                         | Indicates wither the node passed                       |
| failed   | Boolean                         | Indicates wither the node failed                       |
| skipped  | Boolean                         | Indicates wither the node skipped                      |
| error    | Error                           | Populated if the test fails                            |
| duration | Number                          | Milliseconds                                           |
| tests    | Number                          | Number of tests                                        |
| failures | Number                          | Number of failures                                     |
| skips    | Number                          | Number of skipped tests                                |
| children | Array&lt;GraphNode&gt;          | Array of child nodes                                   |
| parent   | GraphNode                       | Parent node                                            |
| resolve  | Function(...Number) : GraphNode | Resolves the specified child, e.g. `.resolve(1, 2, 3)` |

### SurefireReporter

A [Surefire](https://maven.apache.org/surefire/maven-surefire-plugin/index.html) reporter which is compatible with the [Jenkins xUnit plugin](https://plugins.jenkins.io/xunit/)

```js
const reporter = new SurefireReporter();
await harness.run(reporter);
```

#### Options

| Option | Type            | Default | Notes                       |
| ------ | --------------- | ------- | --------------------------- |
| stream | stream.Writable | stdout  | Override to redirect output |

#### Sample Output

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<testsuite name="Suite" tests="2" failures="1" errors="0" skipped="0" time="10.023">
  <testcase name="Suite / should pass" time="5">
  </testcase>
  <testcase name="Suite / should fail" time="5.023">
    <failure message="Oh Noes!" type="AssertionError">
<![CDATA[
AssertionError [ERR_ASSERTION]: 1 == 2
    at Test._fn (/Users/example/zunit/test/Test.test.js:273:14)
    at async Promise.all (index 0)
    at async Test._runAll (/Users/example/zunit/lib/Test.js:80:7)
    at async Test.run (/Users/example/zunit/lib/Test.js:64:7)
    at async Suite._runTestable (/Users/example/zunit/lib/Suite.js:136:5)
    at async Suite._runAll (/Users/example/zunit/lib/Suite.js:127:9)
    at async Suite.run (/Users/example/zunit/lib/Suite.js:114:7)
    at async Suite._runTestable (/Users/example/zunit/lib/Suite.js:136:5)
    at async Suite._runAll (/Users/example/zunit/lib/Suite.js:127:9)
    at async Suite.run (/Users/example/zunit/lib/Suite.js:114:7)
]]>
    </failure>
  </testcase>
</testsuite>
```

It is necessary to take some liberties with the Surefire format since:

- it does not support nested test suites
- it has no concept of Before/After hooks
- it differentiates between assertion failures and errors

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

```
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
| ------- | --------------- | ------- | --------------------------- |
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

| Option | Type            | Default | Notes                       |
| ------ | --------------- | ------- | --------------------------- |
| stream | stream.Writable | stdout  | Override to redirect output |

#### Sample Output

```
TAP version 13
1..2
ok 1 - Harnesses / should run a test suite
ok 2 - Harnesses / should run an individual test
```

### RickReporter

The [Rick](https://www.youtube.com/watch?v=dQw4w9WgXcQ) Reporter is for when you need persistence and integrity.

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
  assert.strictEqual(1, 2);
});
const test2 = new Test('Test 2', async () => {
  assert.strictEqual(1, 2);
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
      "error",
      {
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

### Migrating from Mocha

Migrating from Mocha can be extremely quick, depending on the features and api style you use.

#### Callbacks

Mocha

```js
describe('foo', () => {
  it('bar', (done) => {});
});
```

zUnit

```js
describe('foo', () => {
  it('bar', (test, done) => {});
});
```

#### this

Mocha

```js
describe('foo', () => {
  it('bar', function () {
    this.timeout(1000);
    this.slow(500); // No zUnit equivalent
    this.skip();
  });
});
```

zUnit

```js
describe('foo', () => {
  it(
    'bar',
    (t) => {
      t.skip('optional reason');
    },
    { timeout: 1000 }
  );
});
```

#### Global functions (describe, it, etc)

Mocha conveniently makes its test functions global. If you want to achieve the same with zUnit, you can set `pollute` to true in the launch script config, or if you have written your own launch script, add the following code.

```js
const { syntax } = require('zunit');
Object.entries(syntax).forEach(([keyword, fn]) => (global[keyword] = fn));
```

#### it.skip / it.only

Mocha

```js
describe('foo', () => {
  it.only('bar', () => {});
  it.skip('baz', () => {});
});
```

zUnit

```js
describe('foo', () => {
  oit('bar', () => {});
  xit('baz', () => {});
});
```

## Credits

- [Frank Carver](http://www.frankcarver.me/) for schooling me on the things a test harness should and shouldn't do.
- [geopic](https://github.com/geopic) for contributing zUnit's TypeScript defintions.
