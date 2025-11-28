/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 */
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = mergeConfig(defaultConfig, {
  resolver: {
    // Allow importing .cjs packages (needed for some dependencies)
    sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs']
  }
});
