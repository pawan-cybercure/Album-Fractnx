module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src'
        },
        extensions: ['.ts', '.tsx', '.js', '.json']
      }
    ],
    // Must stay last for Reanimated to work correctly
    'react-native-reanimated/plugin'
  ]
};
