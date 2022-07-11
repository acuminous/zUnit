function timeout(fn, duration) {
  let timer;
  return Promise.race([
    new Promise((resolve, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Timed out after ${Number(duration).toLocaleString()}ms`));
      }, duration);
    }),
    fn().finally(() => clearTimeout(timer)),
  ]);
}

module.exports = timeout;
