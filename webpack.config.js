var path = require('path');

module.exports = {
  entry: ['babel-polyfill', './src/index.js'],
  devtool: 'cheap-module-eval-source-map',
  target: 'web',
  output: {
    path: path.join(__dirname, 'public'),
    filename: "bundle.js"
  },
  module: {
    loaders: [
      {
        loader: "babel-loader",
        exclude: /(node_modules)/,
        test: /\.jsx?$/,
        query: { plugins: ['transform-runtime'] }
      }
    ]
  }
};
