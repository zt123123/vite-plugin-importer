const path = require("path")
const url = require("url")

let import_;

try {
  import_ = function (filepath) {
    return import(filepath)
  }
} catch (error) {
  console.log('error:', error);
}

async function loadCjsOrMjsDefault(filepath) {
  switch (guessJSModuleType(filepath)) {
    case "cjs":
      return loadCjsDefault(filepath);

    case "unknown":
      try {
        return loadCjsDefault(filepath);
      } catch (e) {
        console.log("error:", e.toString());
      }

    case "mjs":
      try {
        return await loadMjsDefault(filepath);
      } catch (error) {
        throw new Error(error)
      }
  }
}

function guessJSModuleType(filename) {
  switch (path.extname(filename)) {
    case ".cjs":
      return "cjs";

    case ".mjs":
      return "mjs";

    default:
      return "unknown";
  }
}

function loadCjsDefault(filepath) {
  try {
    const module = require(filepath);
    return module != null && module.__esModule ? module.default : module;
  } catch (error) {
    console.log('load cjs error:', error.toString());
    return null
  }
}

function loadMjsDefault() {
  return _loadMjsDefault.apply(this, arguments);
}

async function _loadMjsDefault(filepath) {
  if (!import_) {
    throw new Error("Internal error: Native ECMAScript modules aren't supported" + " by this platform.\n");
  }

  const module = await import_(url.pathToFileURL(filepath));
  return module.default;
}

module.exports = loadCjsOrMjsDefault;
