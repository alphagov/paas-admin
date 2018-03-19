const fs = require('fs');
const path = require('path');
const {getOptions, parseQuery} = require('loader-utils');
const validateOptions = require('schema-utils');
const nunjucks = require('nunjucks');
const {transform} = require('nunjucks/src/transformer');
const {Environment} = require('nunjucks/src/environment');
const nodes = require('nunjucks/src/nodes');
const optionsSchema = require('./schema.json');

async function _resolvePath(ctx, opts, templatePath, context) {
  let parentPath;
  if (context && context.length > 0) {
    for (let i = 0; i < context.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      parentPath = await resolvePath(ctx, opts, context[i], parentPath ? [parentPath] : []);
    }
  }
  return new Promise((resolve, reject) => {
    ctx.resolve(parentPath ? path.dirname(parentPath) : ctx.context, templatePath, (err, resolvedPath) => {
      if (err) {
        return reject(err);
      }
      ctx.addDependency(resolvedPath);
      resolve(resolvedPath);
    });
  });
}

async function resolvePath(ctx, opts, templatePath, context) {
  /* istanbul ignore if */
  if (!templatePath) {
    throw new Error(`Can't resolve path: ""`);
  }
  let _err;
  try {
    return await _resolvePath(ctx, opts, templatePath, context);
  } catch (err) {
    _err = err;
  }
  /* istanbul ignore if */
  if (opts.includePaths.length === 0) {
    throw new Error(`Can't resolve "${templatePath}". HINT: use relative imports ('./') or node_modules imports ('~') or set 'includePaths' option to add search paths`);
  }
  for (let i = 0; i < opts.includePaths.length; i++) {
    const root = opts.includePaths[i];
    try {
      // eslint-disable-next-line no-await-in-loop
      return await _resolvePath(ctx, opts, path.join(root, templatePath), context);
    } catch (err) {
      /* istanbul ignore next */
      _err = err;
      /* istanbul ignore next */
      continue;
    }
  }
  /* istanbul ignore next */
  throw new Error(`Can't resolve "${templatePath}" from "${context.reverse().join(' from ')}" in any of [\n  ${opts.includePaths.join(',\n  ')}\n]: ${_err.message || _err}`);
}

// Return list of all template files we need by parsing the
// njk templates and finding all the import/extend/include calls
async function getTemplatePaths(ctx, opts, templatePath, context) {
  const templates = {};
  const resolvedPath = await resolvePath(ctx, opts, templatePath, context);
  templates[context.concat(templatePath).join(':')] = resolvedPath;
  const source = fs.readFileSync(resolvedPath).toString();
  const ast = transform(nunjucks.parser.parse(source));
  const templateNodes = [];
  ast.findAll(nodes.Extends, templateNodes);
  ast.findAll(nodes.Include, templateNodes);
  ast.findAll(nodes.FromImport, templateNodes);
  ast.findAll(nodes.Import, templateNodes);
  for (let i = 0; i < templateNodes.length; i++) {
    const templateNode = templateNodes[i].template;
    /* istanbul ignore if */
    if (!templateNode || !templateNode.value) {
      throw new Error(`bad template path in ${ctx.resourcePath}: ${JSON.stringify(templateNodes[i])}`);
    }
    // eslint-disable-next-line no-await-in-loop
    const children = await getTemplatePaths(ctx, opts, templateNode.value, context.concat(templatePath));
    for (const k in children) {
      /* istanbul ignore next */
      if (templates[k] && templates[k] !== children[k]) {
        throw new Error(`ambiguous template name: "${k}" refers to\n${templates[k]}\n AND \n${children[k]}\nUnfortunatly this is a shortcoming of the njk-loader.`);
      }
      templates[k] = children[k];
    }
  }
  return templates;
}

async function pitch(ctx, opts, _remainingRequest) {
  const importsLoader = ctx.target === 'web' ? '' : 'imports-loader?window=>{}!';
  const slim = opts.precompile === true && ctx.loaderIndex === ctx.loaders.length - 1 ? '-slim' : '';
  ctx.data.runtimePath = `${importsLoader}nunjucks/browser/nunjucks${slim}`;
  if (opts.mode) {
    return;
  }
  const resolvedPath = await resolvePath(ctx, opts, ctx.resourcePath, []);
  const templates = await getTemplatePaths(ctx, opts, resolvedPath, []);
  const configure = opts.configure ? `import configure from '${opts.configure}'` : `function configure(env) {return env}`;
  const outputSource = `
    import { Environment } from '${ctx.data.runtimePath}';
    ${configure};
    const templates = {
      ${Object.keys(templates).map(name => `
        "${name}": require('${templates[name]}?mode=compile&name=${name}')
      `).join(',')}
    }
    function Loader(){};
    Loader.prototype.getSource = function(name) {
      let tmpl = templates[name];
      if (!tmpl) {
        throw new Error('njk-loader: template not found: '+name);
      }
      return tmpl;
    }
    Loader.prototype.isRelative = function(templateName) {
      return true;
    }
    Loader.prototype.resolve = function(parentName, templateName) {
      return [parentName, templateName].join(':');
    }

    const hmrThing = '${new Date()}';
    const env = new Environment(new Loader(), ${JSON.stringify(getEnvironmentOptions(opts))});
    configure(env);

    export function render(o) {
      return env.render('${ctx.resourcePath}', o);
    }
    export default {render};
  `;
  return outputSource;
}

// eslint-disable-next-line max-params
async function load(ctx, opts, source, _map, _meta) {
  if (opts.mode === 'raw') {
    if (ctx.loaderIndex === ctx.loaders.length - 1) {
      return {source: `export default ${JSON.stringify(source)}`};
    }
    return {source};
  }

  // If we're not the first loader or precompile is disabled, then we can't precompile or use slim
  if (opts.precompile === false || ctx.loaderIndex !== ctx.loaders.length - 1) {
    source = `
      module.exports = {
        src: (function(){
          const {Environment, Template} = require('${ctx.data.runtimePath}');
          let raw = require('${ctx.resourcePath}?mode=raw&name=${opts.name}');
          if (typeof raw !== 'string' && raw.default) {
            raw = raw.default;
          }
          if (typeof raw !== 'string') {
            throw new Error('expected a string template got'+typeof raw);
          }
          return raw;
        })(),
        path: '${opts.name}',
        noCache: false
      }
    `;
    return {source};
  }

  source = nunjucks.precompileString(source, {
    name: opts.name,
    wrapper: (templates, _opts) => {
      return `
        const { runtime } = require('${ctx.data.runtimePath}');
        module.exports = {
          src: {
            type: 'code',
            obj: (function(){
              ${templates[0].template};
            })()
          },
          path: '${opts.name}',
          noCache: true,
        };
      `;
    },
    env: new Environment([], getEnvironmentOptions(opts))
  });

  return {source};
}

function getEnvironmentOptions(opts) {
  const environmentOptions = {
    autoescape: opts.autoescape !== false,
    throwOnUndefined: opts.throwOnUndefined === true,
    trimBlocks: opts.trimBlocks === true,
    lstripBlocks: opts.lstripBlocks === true,
    opts: {}
  };
  if (opts.tags) {
    environmentOptions.tags = opts.tags;
  }
  return environmentOptions;
}

function getOpts(ctx) {
  const loaderOpts = getOptions(ctx);
  const opts = {...loaderOpts};
  if (!Array.isArray(opts.includePaths)) {
    opts.includePaths = [];
  }
  validateOptions(optionsSchema, opts, 'njk-loader');
  if (ctx.resourceQuery) {
    const params = parseQuery(ctx.resourceQuery);
    opts.mode = params.mode;
    opts.name = params.name;
  }
  /* istanbul ignore if */
  if (opts.precompile === true && ctx.loaderIndex !== ctx.loaders.length - 1) {
    throw new Error(`njk-loader: cannot force precompile:true because njk-loader is not the first loader so must rely on runtime copmilation`);
  }
  return opts;
}

function loader(source, map, meta) {
  const opts = getOpts(this);
  const done = this.async();
  /* istanbul ignore next */
  if (this.cacheable) {
    this.cacheable();
  }
  load(this, opts, source, map, meta).then(out => done(null, out.source, out.map, out.meta)).catch(done);
}

function pitcher(remainingRequest) {
  const ctx = this;
  const done = this.async();
  const opts = getOpts(ctx);
  /* istanbul ignore next */
  if (this.cacheable) {
    this.cacheable();
  }
  return pitch(ctx, opts, remainingRequest).then(out => {
    if (out) {
      return done(null, out);
    }
    done();
  }).catch(done);
}

module.exports = loader;
module.exports.pitch = pitcher;
