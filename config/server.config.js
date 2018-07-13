const webpack = require('webpack');
const NodemonPlugin = require('nodemon-webpack-plugin');
const path = require('path');

module.exports = cfg => {
  if (cfg.watch) {
    cfg.plugins.push(new NodemonPlugin({
      watch: path.resolve('./dist'),
      ignore: ['*.map'],
      verbose: true,
      script: './dist/main.js'
    }));
  }
  return cfg;
};
