const packageDirectory = require("find-pkg")
const path = require("path")
const fs = require("fs")
const json = require("json5")
const gensync = require("gensync");
const loadCjsOrMjsDefault = require("./module-types.js")

const ROOT_CONFIG_FILENAMES = ["babel.config.js", "babel.config.cjs", "babel.config.mjs", "babel.config.json"];
const RELATIVE_CONFIG_FILENAMES = [".babelrc", ".babelrc.js", ".babelrc.cjs", ".babelrc.mjs", ".babelrc.json"];

function readConfigJSON5(filepath) {
  let options;
  let content;
  try {
    content = fs.readFileSync(filepath, "utf8")
  } catch (error) { }
  if (!content) {
    return null
  }
  try {
    options = json.parse(content);
  } catch (err) {
    err.message = `${filepath}: Error while parsing config - ${err.message}`;
    throw err;
  }

  if (!options) throw new Error(`${filepath}: No config detected`);

  if (typeof options !== "object") {
    throw new Error(`${filepath}: Config returned typeof ${typeof options}`);
  }

  if (Array.isArray(options)) {
    throw new Error(`${filepath}: Expected config object but found array`);
  }

  delete options["$schema"];
  return {
    filepath,
    dirname: path.dirname(filepath),
    options
  };
}

function* readConfigJS(filepath) {
  if (!fs.existsSync(filepath)) {
    return null;
  }
  let options;

  try {
    options = yield* loadCjsOrMjsDefault(filepath);
  } catch (err) {
    err.message = `${filepath}: Error while loading config - ${err.message}`;
    throw err;
  }

  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new Error(`${filepath}: Configuration should be an exported JavaScript object.`);
  }

  if (options instanceof Function) {
    options = options()
  }

  return {
    filepath,
    dirname: path.dirname(filepath),
    options
  };
}

function* readConfig(filepath) {
  const ext = path.extname(filepath);
  return ext === ".js" || ext === ".cjs" || ext === ".mjs" ? yield* readConfigJS(filepath) : readConfigJSON5(filepath);
}


function findPackageData() {
  const pkgPath = packageDirectory.sync()
  const pkgDir = path.dirname(pkgPath);
  return {
    directories: [
      pkgDir
    ],
    pkg: {
      filepath: pkgPath,
      filename: pkgPath,
      dirname: pkgDir,
      options: readConfigJSON5(pkgPath).options
    },
    isPackage: true
  };
}

function packageToBabelConfig(file) {
  const babel = file.options["babel"];
  if (typeof babel === "undefined") return null;

  if (typeof babel !== "object" || Array.isArray(babel) || babel === null) {
    throw new Error(`${file.filepath}: .babel property must be an object`);
  }

  return {
    filepath: file.filepath,
    dirname: file.dirname,
    options: babel
  };
}

const loadOneConfig = gensync(function* (names, dirname, previousConfig = null) {
  const configs = yield* gensync.all(names.map(filename => readConfig(path.join(dirname, filename))));
  const config = configs.reduce((previousConfig, config) => {
    if (config && previousConfig) {
      throw new Error(`Multiple configuration files found. Please remove one:\n` + ` - ${path.basename(previousConfig.filepath)}\n` + ` - ${config.filepath}\n` + `from ${dirname}`);
    }

    return config || previousConfig;
  }, previousConfig);
  return config;
})

function findRelativeConfig(packageData) {
  let config = null;

  for (const loc of packageData.directories) {
    if (!config) {
      config = loadOneConfig.sync(RELATIVE_CONFIG_FILENAMES, loc, packageToBabelConfig(packageData.pkg));
    }
  }
  if (!config) {
    return config
  }

  return {
    ...config
  };
}

function findRootConfig(dirname) {
  return loadOneConfig.sync(ROOT_CONFIG_FILENAMES, dirname);
}

function formatConfig(finalConfig) {
  return finalConfig.reduce((prev, next) => {
    const options = next.options || {}
    const plugins = options.plugins || []
    const presets = options.presets || []
    prev.plugins ? prev.plugins.push(...plugins) : prev.plugins = [...plugins]
    prev.presets ? prev.presets.push(...presets) : prev.presets = [...presets]
    return prev
  }, {})
}

/**
 * find user config of babel
 * reference to // https://github.com/babel/babel/blob/main/packages/babel-core/src/config/files/configuration.ts
 */
const resolveBabelConfig = gensync(function* (options = {}) {
  const {
    cwd = ".",
    root: rootDir = ".",
  } = options;
  const absoluteCwd = path.resolve(cwd);
  const absoluteRootDir = path.resolve(absoluteCwd, rootDir);
  const context = {
    cwd: absoluteCwd,
    root: absoluteRootDir,
  };
  const packageData = findPackageData()
  const rootBabelConfig = findRootConfig(context.root)
  const relativeBabelConfig = findRelativeConfig(packageData)
  const finalConfig = []
  if (rootBabelConfig) {
    finalConfig.push(rootBabelConfig)
  }
  if (relativeBabelConfig) {
    finalConfig.push(relativeBabelConfig)
  }
  return formatConfig(finalConfig)
})

process.on("unhandledRejection", e => {
  console.log('error:', e);
})
resolveBabelConfig.sync()

module.exports = resolveBabelConfig




