function getCaller(limit) {
  const originalPrepareStackTrace = Error.prepareStackTrace;
  const originalStackTraceLimit = Error.stackTraceLimit;

  Error.prepareStackTrace = function(_, stack) {
    return stack;
  };

  Error.stackTraceLimit = limit;

  const err = new Error();

  Error.captureStackTrace(err, getCaller);

  const stack = err.stack;

  Error.prepareStackTrace = originalPrepareStackTrace;
  Error.stackTraceLimit = originalStackTraceLimit;

  const fileName = stack[stack.length - 1].getFileName();
  return require.cache[fileName];
}

module.exports = getCaller;
