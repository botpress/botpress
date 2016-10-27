var webpack = require('webpack');
var path = require('path');

module.exports = {
  entry: {
    vendor: ['react',
      'react-bootstrap',
      'axios',
      'react-router',
      'history',
      'boostrap',
      'moment',
      'lodash',
      'nuclear-js',
      'classnames',
      'eventemitter2',
      'react-sidebar',
      'nuclear-js-react-addons']
  },
  output: {
    path: path.resolve(__dirname, '../lib/web/js'),
    filename: '[name].dll.bundle.js',
    library: '[name]_dll'
  },
  resolve: {
    root: [path.join(__dirname, '..', 'node_modules')],
    extensions: ['', '.js', '.jsx', '.css']
  },
  plugins: [
        new webpack.DllPlugin({
      path: path.join(__dirname, "../lib/web/js", "[name]-manifest.json"),
      name: "[name]_dll"
    })
    ]
}
