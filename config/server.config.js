const webpack = require('webpack');
const StartServerPlugin = require('start-server-webpack-plugin');

module.exports = cfg => {
  cfg.plugins.push(new StartServerPlugin('main.js'));
  if (cfg.watch) {
    cfg.plugins.push(new webpack.HotModuleReplacementPlugin());
    cfg.entry.main.push('webpack/hot/poll?1000');
  }
  return cfg;
};
