# ZUnit
ZUnit is a zero dependency, non polluting, test harness for Node that you can run without any special scripts. I wrote it because [mocha](https://mochajs.org/), my preferred test harness, is the #1 source of vulnerabilities in my open source projects and I'm tired of updating them just because one of mocha's dependencies reports an audit warning.

Consequently ZUnit is nowhere near as feature rich as mocha, e.g. it does not support parallel test, retries or file globbing, but most of the simpler features are present.

## TL;DR

1. Create a runner, e.g. `tests/index.js`
    ```js
    const { reporters } = require('zunit');
    const path = require('path');

    const { MultiReporter, ConsoleReporter, TapReporter } = reporters;
    const filename = path.resolve(__dirname, process.argv[2]);
    const runnable = require(filename);

    const reporter = new MultiReporter()
      .add(new ConsoleReporter(), new TapReporter());

    runnable.run(reporter).then(() => {
      if (runnable.failed) process.exit(1);
    })
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
        should list all users - PASSED (2ms)
        should list matching use - SKIPPED (0ms)
        
    Summary
      Passed: 1, Skipped: 1, Failed: 0, Duration: 2ms
      
    ```

## Composing Test Suites
Because ZUnit doesn't automatically build tests suites by file globbing, you need to define them explicitly. This easiest way of doing this is by creating a main test suite and including others from it. e.g.

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

1. Passing a timeout option to `describe` (affects all tests)
    ```js
    const { describe } = require('zunit');

    describe('My Suite', ({ it }) => {
      it('should do something wonderful', async () => {
      });
    }, { timeout: 10000 });
    ```

### Failing Fast / Aborting Early
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

## Reporters
ZUnit ships with the following reporters

* [ConsoleReporter](#consolereporter)
* [TapReporter](#tapreporter)
* [GraphReporter](#graphreporter)
* [MultiReporter](#multireporter)
* [NullReporter](#nullreporter)

