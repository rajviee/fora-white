// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

let config = getDefaultConfig(__dirname);

// Apply NativeWind
config = withNativeWind(config, { input: "./global.css" });

config.resolver = {
  ...config.resolver,
  platforms: ["native", "web", "ios", "android"],
  alias: {
    ...config.resolver?.alias,
  },
  sourceExts: [...(config.resolver?.sourceExts || []), "mjs"],

  // 👇 this is the important fix
  unstable_conditionNames: ["browser", "require", "react-native"],
};

config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

module.exports = config;
