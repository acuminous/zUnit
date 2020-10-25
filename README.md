# ZUnit
ZUnit is a zero dependency, non polluting, test harness for Node that you can run without any special scripts. I wrote it because [mocha](https://mochajs.org/), my preferred test harness, is the #1 culprit for vulnerabilities in my open source projects and I'm tired of updating them just because one of mocha's dependencies causes an audit warning.

Completely reimplementing mocha without dependencies would likely introduce even more issues. Consequently, ZUnit is nowhere near as feature rich, e.g. it does not support parallel test, retries or file globbing, but most of the simpler features are present, so it should still be perfectly usable.

## TL;DR

1. Create a runner, e.g. `tests/index.js`
    ```js
    const { reporters } = require('zunit');
    const path = require('path');

    const { MultiReporter, SpecReporter, TapReporter } = reporters;
    const filename = path.resolve(__dirname, process.argv[2]);
    const runnable = require(filename);

    const reporter = new MultiReporter()
      .add(new SpecReporter(), new TapReporter());

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
        should list all users
        - PASSED (2ms)
        should list matching use
        - SKIPPED (0ms)

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

## Exclusive Tests
You can selectively run tests or suites as follows...

1. Create a dedicated suite
    ```js
    const { describe } = require('zunit');
    const homePageTests = require('./frontend/profile-page.test');
    const settingsPageTests = require('./frontend/settings-page.test');
    const searchPageTests = require('./frontend/search-page.test');

    describe('Frontend Tests', ({ it }) => {
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

## Lifecycle Hooks (before, after, beforeEach, afterEach)

* before - runs once before the first test in the enclosing and included suites
* after - runs once after the last test in the enclosing and included suites
* beforeEach - runs before each test in the enclosing and included suites
* afterEach - runs after each test in the enclosing and included suites

This is best demonstrated with an example
```js
const { describe } = require('zunit');

describe('Suite', ({ before, after, beforeEach, afterEach, describe, it }) => {

  before(async () => {
    console.log('Before')
  })

  beforeEach(async () => {
    console.log('Before Each')
  })

  after(async () => {
    console.log('After')
  })

  afterEach(async () => {
    console.log('After Each')
  })

  it('Test 1', async () => {
  })

  it('Test 2', async () => {
  })

  describe('Nested Suite', ({ before, after, beforeEach, afterEach, it }) => {

    before(async () => {
      console.log('Nested Before')
    })

    beforeEach(async () => {
      console.log('Nested Before Each')
    })

    after(async () => {
      console.log('Nested After')
    })

    afterEach(async () => {
      console.log('Nester After Each')
    })

    it('Nested Test 1', async () => {
    })

    it('Nested Test 2', async () => {
    })
  });

})
```

```bash
node tests hooks-example.js

  Suite
Before
Before Each
    ✓ Test 1
After Each
Before Each
    ✓ Test 2
After Each
    Nested Suite
Nested Before
Before Each
Nested Before Each
      ✓ Nested Test 1
Nester After Each
After Each
Before Each
Nested Before Each
      ✓ Nested Test 2
Nester After Each
After Each
Nested After
After

```

## Reporters
ZUnit ships with the following reporters

* [SpecReporter](#specreporter)
* [TapReporter](#tapreporter)
* [GraphReporter](#graphreporter)
* [MultiReporter](#multireporter)
* [NullReporter](#nullreporter)

