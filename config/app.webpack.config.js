var webpack = require('webpack');
var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');

var resolveBabel = function(name) {
  return path.join(__dirname, '..', 'node_modules', name)
}

var babelPlugins = [
  resolveBabel('babel-plugin-transform-object-rest-spread'),
  resolveBabel('babel-plugin-transform-decorators-legacy')
];

var babelPresets = [
  resolveBabel('babel-preset-es2015'),
  resolveBabel('babel-preset-stage-0'),
  resolveBabel('babel-preset-react')
];

module.exports = {
  bail: true,
  devtool: 'source-map',
  entry: {
    app: path.resolve(__dirname, '../src/web/index.jsx')
  },
  output: {
    path: path.resolve(__dirname, '../lib/web/js'),
    publicPath: '/js/',
    filename: '[name].dll.bundle.js'
  },
  resolve: {
    root: [path.join(__dirname, '..', 'node_modules')],
    extensions: ['', '.js', '.jsx', '.css'],
    alias: {
      '~': path.resolve(__dirname, '../src/web')
    }
  },
  resolveLoader: {
    root: path.join(__dirname, '..', 'node_modules')
  },
  plugins: [
    // new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.NoErrorsPlugin(),
    new webpack.DllReferencePlugin({
      context: path.join(__dirname, '..'),
      manifest: require(path.join(__dirname, '../lib/web/js', 'vendor-manifest.json'))
    }),
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, '../src/web/index.html'),
        to: path.resolve(__dirname, '../lib/web/index.html')
      },
      {
        from: path.resolve(__dirname, '../src/web/img'),
        to: path.resolve(__dirname, '../lib/web/img')
      }
    ])
  ],
  module: {
    loaders: [{
        test: /\.jsx?$/,
        exclude: /botskin\/node_modules/,
        loader: 'babel-loader',
        query: {
          presets: babelPresets,
          plugins: babelPlugins,
          compact: false,
          babelrc: false
        }
        },
      {
        test: /\.scss$/,
        loaders: ['style', 'css?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]', 'sass']
        },
      {
        test: /\.css$/,
        loaders: ['style', 'css']
        },
      {
        test: /\.woff|\.woff2|\.svg|.eot|\.ttf/,
        loader: 'file?name=../fonts/[name].[ext]'
        },
      {
        test: /\.json$/,
        loader: "json-loader"
        }]
  }
}
