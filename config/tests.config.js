const path = require('path');
const glob = require('glob');
const WebpackShellPlugin = require('webpack-shell-plugin');

module.exports = cfg => {
  const onFail = process.env.ENABLE_WATCH === 'true' ? '|| true' : '';
  let args = '--no-coverage';

  // Include all .test.js files as entry points
  glob.sync(path.resolve(__dirname, '../src/**/*.test.js')).map(f => path.relative(__dirname, f).replace('..', '.')).forEach(f => {
    cfg.entry[path.basename(f, '.js')] = [f];
  });

  // Add instrumentation for code coverage checking
  if (process.env.ENABLE_COVERAGE === 'true') {
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
    args = `--100`;
  }

  // Add plugin to execute test runner
  cfg.plugins.push(new WebpackShellPlugin({
    onBuildExit: [{
      command: `sh`,
      args: [
        `-c`,
        `./node_modules/.bin/tap ${args} --nyc-arg='--instrument=false' --reporter classic -J ./dist/*.test.js && echo '\n✓ ALL TESTS PASSED!' ${onFail}`
      ]
    }]
  }));

  return cfg;
};
