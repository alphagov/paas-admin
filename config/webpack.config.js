const path = require('path');
const CompressionPlugin = require('compression-webpack-plugin');
const OptimizeCssnanoPlugin = require('@intervolga/optimize-cssnano-plugin');
const webpack = require('webpack');
const nodeModules = require('webpack-node-externals');
const enableServer = require('./server.config');

const NODE_ENV = process.env.NODE_ENV || 'development';
const assetName = ext => `assets/[hash:base32].[name].${ext || '[ext]'}`;

let cfg = {

  target: 'node',

  mode: NODE_ENV,

  entry: {
    main: ['./src/main.ts'],
    "assets/init": ['./src/frontend/javascript/init.js'],
    "assets/sankey": ['./src/frontend/javascript/sankey.js'],
    "assets/analytics": ['./src/frontend/javascript/analytics.js'],
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

  optimization: {
    splitChunks: false,
    runtimeChunk: false
  },

  performance: {
    hints: false
  },

  resolve: {
    extensions: ['.ts', '.js', '.json']
  },

  module: {
    rules: [
      {
        test: /\.(png|jpg|ico|svg|gif)$/,
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
              sourceMap: true
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
              includePaths: ['@govuk-frontend/govuk/components'],
              configure: path.resolve(__dirname, './nunjucks.config.js')
            }
          },
          {
            loader: 'html-loader',
            options: {
              attrs: ['img:src', 'link:href', 'script:src']
            }
          }
        ]
      },
      {
        test: /\.ts/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              reportFiles: [/(?<!\.test)\.ts/]
            }
          }
        ]
      },
      {
        test: /\.pegjs$/,
        use: [
          {
            loader: 'pegjs-loader'
          }
        ]
      }
    ]
  },

  plugins: [
    new webpack.EnvironmentPlugin({NODE_ENV}),
    new CompressionPlugin({
      test: /\.(js|svg|css)$/,
      include: 'assets/',
      deleteOriginalAssets: true
    })
  ]
};

if (process.env.ENABLE_WATCH === 'true') {
  cfg.watch = true;
}

if (process.env.ENABLE_SERVER === 'true') {
  cfg = enableServer(cfg);
}

if (NODE_ENV === "production") {
  cfg.plugins.push(new OptimizeCssnanoPlugin({
    sourceMap: false,
    cssnanoOptions: {
      preset: ['default', {
        discardComments: {
          removeAll: true,
        },
      }],
    },
  }));
}

cfg.externals.push(nodeModules({whitelist: []}));

module.exports = cfg;
