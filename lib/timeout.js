function timeout(fn, duration) {
  return Promise.race([
    fn(),
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timed out after ${Number(duration).toLocaleString()}ms`));
      }, duration);
      timer.unref && timer.unref();
    }),
  ])
};

module.exports = timeout;
