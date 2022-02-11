module.exports = {
  // NB: Allows setting CSP without raising errors. The default setting is eval-source-map, which causes Webpack
  // to emit eval(...)'s in the renderer bundle, which makes any CSP you set unnhappy unless you allow unsafe-eval,
  // but then Electron gives you a warning. (As it should.) The tradeoff is that inline-source-map is slower.
  devtool: 'inline-source-map',
  output: {
    // NB: Can also be "window", etc.
    libraryTarget: 'var',
  },
  // NB: Target can be set to "electron-renderer", as well, but that defeats the point since electron-renderer
  // is a configuration that's intended to help augment the bundle to work with nodeIntegration: true.
  target: 'web',
};
