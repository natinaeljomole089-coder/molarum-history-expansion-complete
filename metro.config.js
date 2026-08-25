const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Virtual CSS modules avoid Metro hashing a missing web.css file during
  // static exports from a clean clone while keeping NativeWind HMR support.
  forceWriteFileSystem: false,
});
