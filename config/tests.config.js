const path = require('path');
const glob = require('glob');
const WebpackShellPlugin = require('webpack-shell-plugin');

module.exports = cfg => {
  const onFail = process.env.ENABLE_WATCH === 'true' ? '|| true' : '';
  let args = '--no-coverage';
  const focusGlob = process.env.TEST_FOCUS || '';

  // Include all .test.ts files as entry points
  glob.sync(path.resolve(__dirname, `../src/**/${focusGlob}*.test.ts`)).map(f => path.relative(__dirname, f).replace('..', '.')).forEach(f => {
    cfg.entry[path.basename(f, '.ts')] = [f];
  });

  // Add instrumentation for code coverage checking
  if (process.env.ENABLE_COVERAGE === 'true') {
    cfg.module.rules.unshift({
      test: /\.(ts|js)$/,
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
      exclude: /node_modules|\.test\.(ts|js)$/
    });
    args = `--100`;
  }

  // Add plugin to execute test runner
  cfg.plugins.push(new WebpackShellPlugin({
    onBuildExit: [{
      command: `sh`,
      args: [
        `-c`,
        `./node_modules/.bin/tap ${args} --nyc-arg='--instrument=false' -J --reporter classic ./dist/*.test.js && echo '\n✓ ALL TESTS PASSED!' ${onFail}`
      ]
    }]
  }));

  // Never bundle tap or supertest
  cfg.externals.push((context, request, callback) => {
    if (/^(tap|supertest)$/.test(request)) {
      return callback(null, 'commonjs ' + request);
    }
    callback();
  });

  return cfg;
};
