const path = require('path');
const webpack = require('webpack');
const nodeModules = require('webpack-node-externals');
const StartServerPlugin = require('start-server-webpack-plugin');
const glob = require('glob');

const NODE_ENV = process.env.NODE_ENV || 'development';
const assetName = ext => () => NODE_ENV === 'development' ?
    `assets/[path][name].${ext || '[ext]'}` :
    `assets/[hash].${ext || '[ext]'}`;

const main = {
  target: 'node',

  mode: NODE_ENV,

  entry: {
    main: ['./src/main.js']
  },
  output: {
    path: path.resolve(__dirname, '..', 'dist'),
    filename: '[name].js',
    publicPath: '/'
  },

  devtool: 'source-map',

  externals: ['chokidar'],

  stats: {
    modules: false,
    warningsFilter: [
      // Express uses a dynamic require in view.js but we don't care
      /node_modules\/express\/lib\/view\.js/
    ]
  },

  performance: {
    // Performance hints not that useful for target:node
    hints: false
  },

  module: {
    rules: [
      // FIXME: remove when govuk-frontend has support
      {
        test: /govuk_template_jinja\/assets\/javascripts/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: assetName()
            }
          }
        ]
      },
      {
        test: /\.(png|jpg|ico|svg|gif|css)(\?.*)?$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: assetName()
            }
          }
        ]
      },
      {
        test: /\.(scss)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: assetName('css')
            }
          },
          {
            loader: 'extract-loader',
            options: {
              publicPath: '/'
            }
          },
          {
            loader: 'css-loader',
            options: {
              minimize: NODE_ENV === 'production'
            }
          },
          {
            loader: 'sass-loader',
            options: {
              includePaths: [
                path.resolve(__dirname, '../node_modules')
              ],
              sourceMap: true
            }
          }
        ]
      },
      {
        test: /\.(njk|html)$/,
        use: [
          {
            loader: path.resolve(__dirname, './njk-loader.js'),
            options: {
              includePaths: ['@govuk-frontend']
            }
          },
          {
            loader: 'html-loader',
            options: {
              attrs: ['img:src', 'link:href', 'script:src']
            }
          },
          {
            loader: 'regexp-replace-loader',
            options: {
              match: {
                pattern: '\\?\\d+\\.\\d+\\.\\d+',
                flags: 'g'
              },
              replaceWith: ''
            }
          },
          {
            loader: 'regexp-replace-loader',
            options: {
              match: {
                pattern: '{{ asset_path }}',
                flags: 'g'
              },
              replaceWith: '~govuk_template_jinja/assets/'
            }
          }
        ]
      }
    ]
  },

  plugins: [
    new webpack.EnvironmentPlugin({NODE_ENV})
  ]
};

const whitelist = [
  /govuk-frontend/,
  /govuk_template_jinja/  // FIXME: wait for govuk-frontend to support template
];

if (process.env.ENABLE_WATCH === 'true') {
  main.watch = true;
}

if (process.env.ENABLE_SERVER === 'true') {
  main.plugins.push(new StartServerPlugin('main.js'));
  if (main.watch) {
    console.log('hot reloading enabled');
    main.plugins.push(new webpack.HotModuleReplacementPlugin());
    const hotmode = 'webpack/hot/poll?1000';
    main.entry.main.push(hotmode);
    whitelist.push(hotmode);
  }
}

if (process.env.DISABLE_TESTS !== 'true') {
  main.module.rules.unshift({
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
  glob.sync(path.resolve(__dirname, '../src/**/*.test.js')).map(f => path.relative(__dirname, f).replace('..', '.')).forEach(f => {
    main.entry[path.basename(f, '.js')] = [f];
  });
}

if (NODE_ENV === 'production') {
  main.optimization = {
    splitChunks: false
  };
} else {
  main.optimization = {
    splitChunks: {
      chunks: 'all',
      name: true,
      cacheGroups: {
        vendor: {
          test: /\/node_modules\//,
          chunks: 'all'
        }
      }
    }
  };
  main.externals.push(nodeModules({whitelist}));
}

module.exports = main;
