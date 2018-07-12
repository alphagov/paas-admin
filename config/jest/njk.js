const fs = require('fs');
const path = require('path');

function resolvePath(filename, includeDirectories) {
  for (let i = 0; i < includeDirectories.length; i++) {
    const file = path.resolve(includeDirectories[i], filename);
    
    if (fs.existsSync(file)) {
      return file;
    }
  }

  throw new Error(`template file not found: ${filename}`);
}

function process(source, filename, config) {
  const rootDir = config.rootDir;
  const nodeModules = path.resolve(rootDir, ...config.moduleDirectories);

  return `
  const fs = require('fs');
  const path = require('path');

  const Environment = require('nunjucks/src/environment').Environment;
  const configure = require('${config.rootDir}/config/nunjucks.config.js');

  ${resolvePath.toString()}

  function Loader() {};
  Loader.prototype.getSource = function(filename) {
    return {
      path: filename,
      src: fs.readFileSync(filename).toString()
    };
  };

  Loader.prototype.isRelative = function(templateName) {
    return true;
  }

  Loader.prototype.resolve = function(parentName, templateName) {
    return resolvePath(templateName, [
      path.dirname(parentName),
      '${rootDir}',
      '${nodeModules}',
    ]);;
  }

  const env = new Environment(new Loader(), {});
  configure(env);

  function render(o) {
    return env.render('${filename}', o);
  }

  module.exports = {
    render
  };
  `;
}

module.exports.process = process;
