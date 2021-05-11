const path = require('path')

const NodemonPlugin = require('nodemon-webpack-plugin')
const webpack = require('webpack')

module.exports = cfg => {
  if (cfg.watch) {
    cfg.plugins.push(new NodemonPlugin({
      watch: path.resolve('./dist'),
      ignore: ['*.map'],
      verbose: true,
      script: './dist/main.js'
    }))
  }

  return cfg
}
