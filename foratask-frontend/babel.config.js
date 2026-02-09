module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      [
        "babel-preset-expo",
        {
          unstable_transformImportMeta: true, // 👈 enables import.meta transform
          jsxImportSource: "nativewind",      // 👈 ensures NativeWind works
        },
      ],
      "nativewind/babel",
    ],
    plugins: [
      "react-native-worklets/plugin", // ✅ required for Reanimated v4+
    ],
  };
};
