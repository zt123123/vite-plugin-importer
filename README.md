# vite-plugin-importer-next

> fork from [vite-plugin-importer](https://github.com/ajuner/vite-plugin-importer), the only diffrent is that this module support parsing babel configuration automatically.

[![NPM version](https://img.shields.io/npm/v/vite-plugin-importer-next.svg)](https://npmjs.org/package//vite-plugin-importer-next)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-importer-next.svg)](https://npmjs.org/package//vite-plugin-importer-next)


## features
- Lookup babel config automatically
- Integration for babel-plugin-import/babel-plugin-component

## use

config same as [babel-plugin-import](https://github.com/ant-design/babel-plugin-import) & [babel-plugin-component](https://github.com/ElementUI/babel-plugin-component)

```
npm install vite-plugin-importer-next --save
yarn add vite-plugin-importer-next
```

```js
// vite.config.js
import { defineConfig } from "vite";
import usePluginImport from 'vite-plugin-importer-next'
export default defineConfig({
  plugins: [
    ... // other plugins
    // if not pass param, it will lookup babel config of project root
    usePluginImport(),
    usePluginImport({
      libraryName: "ant-design-vue",
      libraryDirectory: "es",
      style: true,
    }),
    usePluginImport({
      libraryName: "antd",
      libraryDirectory: "es",
      style: true,
    }),
    usePluginImport({
      libraryName: 'vant',
      libraryDirectory: 'es',
      style: (name) => `${name}/style/less`,
    }),
    usePluginImport({
      libraryName: 'element-plus',
      customStyleName: (name) => {
        return `element-plus/lib/theme-chalk/${name}.css`;
      },
    })
    // Other configurations welcome PR
  ];
})

```

or in a .babelrc config
```json
{
  "plugins": [
    // other plugins...
    ["import", {
      "libraryName": "element-ui,
      "style": true,
    ]
  ]
}
```

## LICENSE

[MIT](./LICENSE)

