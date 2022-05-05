const path = require('path');

function process(src, filename, config, options) {
  return {
    code: `module.exports = ${ JSON.stringify(path.basename(filename)) };`,
  };
}

module.exports.process = process;
