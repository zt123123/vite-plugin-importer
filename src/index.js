
const babelImport = require('babel-plugin-import');
const babelComponent = require('babel-plugin-component');
const babel = require('@babel/core');
const importMeta = require('@babel/plugin-syntax-import-meta');
const resolveBabelConfig = require('./resolve-babel-config.js')

// babel-plugin-import
// babel-plugin-component
const pluginList = ['import', 'component']

function usePluginImport(options) {
  let pluginName = ''
  if (!options) {
    const { plugins = [] } = resolveBabelConfig.sync()
    const importConfig = plugins.find(plugin => {
      if (typeof plugin === "string") {
        return pluginList.includes(plugin)
      } else if (Array.isArray(plugin)) {
        return pluginList.includes(plugin[0])
      }
    })
    pluginName = importConfig && importConfig[0]
    options = importConfig && importConfig[1]
  }
  if (!options) {
    throw new Error('options must be an object!!!')
  }

  return {
    name: 'vite-plugin-importer-next',
    transform(code, id) {
      if (/\.(?:[jt]sx?|vue)$/.test(id) && !/node_modules\/vite/.test(id)) {
        const plugins = [importMeta, [pluginName === "import" ? babelImport : babelComponent, options]]
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
