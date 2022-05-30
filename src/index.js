
const babelImport = require('babel-plugin-import');
const babel = require('@babel/core');
const importMeta = require('@babel/plugin-syntax-import-meta');
const resolveBabelConfig = require('./resolve-babel-config.js')

function usePluginImport(options) {
  if (!options) {
    const { plugins = [] } = resolveBabelConfig.sync()
    const importConfig = plugins.find(plugin => {
      if (typeof plugin === "string") {
        return plugin === 'import'
      } else if (Array.isArray(plugin)) {
        return plugin[0] === 'import'
      }
    })
    options = importConfig && importConfig[1]
  }
  if (!options) {
    throw new Error('options must be an object!!!')
  }

  return {
    name: 'vite-plugin-importer-next',
    transform(code, id) {
      if (/\.(?:[jt]sx?|vue)$/.test(id) && !/node_modules\/vite/.test(id)) {
        const plugins = [importMeta, [babelImport, options]]
        const result = babel.transformSync(code, {
          ast: true,
          plugins,
          sourceFileName: id
        })
        return {
          code: result.code,
          map: result.map
        }
      }
    }
  };
};

module.exports = usePluginImport
