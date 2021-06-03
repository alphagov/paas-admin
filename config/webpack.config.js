const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const webpack = require('webpack');
const nodeModules = require('webpack-node-externals');

const enableServer = require('./server.config');

const NODE_ENV = process.env.NODE_ENV || 'development';
const assetName = ext => `assets/[contenthash:base32].[name]${ext || '[ext]'}`;

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

  externalsPresets: { node: true },
  externals: ['chokidar'],

  stats: {
    modules: false,
    warningsFilter: [
      // Express uses a dynamic require in view.js but we don't care
      /node_modules\/express\/lib\/view\.js/,
    ],
  },

  optimization: {
    minimizer: [
      new CssMinimizerPlugin(),
    ],
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
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
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
    new MiniCssExtractPlugin({
      filename: 'assets/govuk.screen.css'
    })
  ],
};

if (process.env.ENABLE_WATCH === 'true') {
  cfg.watch = true; //possibly depricated by webpack 5 https://webpack.js.org/migrate/5/#clean-up-configuration
}

if (process.env.ENABLE_SERVER === 'true') {
  cfg = enableServer(cfg);
}

if (NODE_ENV === 'production') {
  cfg.devtool = false;
  cfg.plugins.push(new CssMinimizerPlugin({
    minimizerOptions: {
      preset: [
        'default',
        {
          discardComments: { removeAll: true },
        },
      ],
    },
  }));
}

cfg.externals.push(nodeModules({ allowlist: [] }));

module.exports = cfg;
