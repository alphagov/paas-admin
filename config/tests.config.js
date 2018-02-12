const path = require('path');
const glob = require('glob');

module.exports = cfg => {
  // Include all .test.js files as entry points
  glob.sync(path.resolve(__dirname, '../src/**/*.test.js')).map(f => path.relative(__dirname, f).replace('..', '.')).forEach(f => {
    cfg.entry[path.basename(f, '.js')] = [f];
  });

  // Add instrumentation for code coverage checking
  cfg.module.rules.unshift({
    test: /\.(js)$/,
    use: [
      {
        loader: 'istanbul-instrumenter-loader',
        options: {
          esModules: true,
          produceSourceMap: true
        }
      }
    ],
    enforce: 'post',
    exclude: /node_modules|\.tests\.js$/
  });

  return cfg;
};
