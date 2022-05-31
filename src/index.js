
const babelImport = require('babel-plugin-import');
const babelComponent = require('babel-plugin-component');
const babel = require('@babel/core');
const importMeta = require('@babel/plugin-syntax-import-meta');
const resolveBabelConfig = require('./resolve-babel-config.js')

// babel-plugin-import
// babel-plugin-component
const pluginList = ['import', 'component']

async function getOptions(options) {
  if (!options) {
    const { plugins = [] } = await resolveBabelConfig()
    const importConfig = plugins.find(plugin => {
      if (typeof plugin === "string") {
        return pluginList.includes(plugin)
      } else if (Array.isArray(plugin)) {
        return pluginList.includes(plugin[0])
      }
    })
    options = importConfig || []
  }
  return function (name) {
    return name === 'pluginName' ? options[0] : options[1]
  }
}

function usePluginImport(options) {
  return {
    name: 'vite-plugin-importer-next',
    async transform(code, id) {
      const handleOptions = await getOptions(options)
      const pluginName = handleOptions('pluginName')
      const pluginConfig = handleOptions('pluginConfig')
      if (!pluginConfig) {
        throw new Error('options must be an object!!!')
      }

      if (/\.(?:[jt]sx?|vue)$/.test(id) && !/node_modules\/vite/.test(id)) {
        const plugins = [importMeta, [pluginName === "import" ? babelImport : babelComponent, pluginConfig]]
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
