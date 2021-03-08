const path = require('path');

const OptimizeCssnanoPlugin = require('@intervolga/optimize-cssnano-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const webpack = require('webpack');
const nodeModules = require('webpack-node-externals');

const enableServer = require('./server.config');

const NODE_ENV = process.env.NODE_ENV || 'development';
const assetName = ext => `assets/[contenthash:base32].[name].${ext || '[ext]'}`;

let cfg = {

  target: 'node',

  mode: NODE_ENV,

  entry: {
    main: ['./src/main.ts'],
    init: {import: './src/frontend/javascript/init.js', filename: 'assets/init.js'},
    sankey: {import: './src/frontend/javascript/sankey.js', filename: 'assets/sankey.js'}
  },

  output: {
    publicPath: '/',
  },

  devtool: 'source-map',

  externals: ['chokidar'],

  stats: {
    modules: false,
    warningsFilter: [
      // Express uses a dynamic require in view.js but we don't care
      /node_modules\/express\/lib\/view\.js/,
    ],
  },

  optimization: {
    splitChunks: false,
    runtimeChunk: false,
  },

  performance: {
    hints: false,
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },

  module: {
    rules: [
      {
        test: /\.(png|jpg|ico|svg|gif)$/,
        type: 'asset/resource',
        generator: {
          filename: assetName()
        } 
      },
      {
        test: /\.(scss)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: assetName('css'),
              esModule: false,
            },
          },
          {
            loader: 'extract-loader',
            options: {
              publicPath: '/',
            },
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: NODE_ENV === 'production' ? false : true,
              url: false,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                includePaths: [
                  path.resolve(__dirname, '../node_modules'),
                ],
              },
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.(ts(x?))/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              reportFiles: [/(?<!\.test)\.ts(x?)/],
            },
          },
        ],
      },
      {
        test: /\.pegjs$/,
        use: [
          {
            loader: 'pegjs-loader',
          },
        ],
      },
    ],
  },

  plugins: [
    new webpack.EnvironmentPlugin({ NODE_ENV }),
    new CompressionPlugin({
      test: /\.(js|svg|css)$/,
      include: 'assets/',
      deleteOriginalAssets: 'keep-source-map',
    }),
  ],
};

if (process.env.ENABLE_WATCH === 'true') {
  cfg.watch = true;
}

if (process.env.ENABLE_SERVER === 'true') {
  cfg = enableServer(cfg);
}

if (NODE_ENV === 'production') {
  cfg.devtool = false;
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

cfg.externals.push(nodeModules({ allowlist: [] }));

module.exports = cfg;
