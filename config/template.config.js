const assetName = ext => `assets/[hash:base32].[name].${ext || '[ext]'}`;

// Patches the given webpack config to allow referencing the govuk_template_jinja
// template from node_modules
module.exports = function (cfg) {
  // If any js files are referenced in the template then include them in the build
  cfg.module.rules.unshift({
    test: /govuk_template_jinja.*\.js$/,
    use: [
      {
        loader: 'file-loader',
        options: {name: assetName()}
      }
    ]
  });

  // If there are any css files referenced then parse them with postcss to
  // rewrite the location of any 'url()' statements and include any assets in
  // the build
  cfg.module.rules.unshift({
    test: /govuk_template_jinja.*\.css$/,
    use: [
      {
        loader: 'file-loader',
        options: {name: assetName()}
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
          importLoaders: 1
        }
      },
      {
        loader: 'postcss-loader',
        options: {
          ident: 'postcss',
          plugins: () => [
            require('postcss-url')([{
              url: u => u.url
              .replace(/\?\d+\.\d+\.\d+/, '')
              .replace(/dist/, '')
            }])
          ]
        }
      }
    ]
  });

  // Extend html rules to perform some hacky replacements
  for (let i = 0; i < cfg.module.rules.length; i++) {
    const r = cfg.module.rules[i];
    if (r.test.test('x.html')) {
      // Remove govuk_template fonts that already come from govuk_frontend
      r.use.push({
        loader: 'regexp-replace-loader',
        options: {
          match: {
            pattern: '.+govuk_template_jinja/assets/stylesheets/fonts.+',
            flags: 'g'
          },
          replaceWith: ''
        }
      });
      // This strips the ?x.x.x version query string which breaks loaders
      r.use.push({
        loader: 'regexp-replace-loader',
        options: {
          match: {
            pattern: '\\?\\d+\\.\\d+\\.\\d+',
            flags: 'g'
          },
          replaceWith: ''
        }
      });
      // This sets {{ asset_path }} variable at compile time rather than runtime
      r.use.push({
        loader: 'regexp-replace-loader',
        options: {
          match: {
            pattern: '{{\\s*asset_path\\s*}}',
            flags: 'g'
          },
          replaceWith: '../../../../node_modules/govuk_template_jinja/assets/'
        }
      });
    }
  }

  return cfg;
};
