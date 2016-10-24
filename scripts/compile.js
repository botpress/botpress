var webpack = require('webpack');
var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = function() {

  var vendorCompiler = webpack({
    entry: {
      vendor: ['react', 'react-bootstrap', 'axios', 'react-router', 'history', 'boostrap']
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
  });

  var appCompiler = webpack({
    bail: true,
    entry: {
      app: path.resolve(__dirname, '../src/web/master/App.jsx')
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
        '~': path.resolve(__dirname, '../src/web/master')
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
          from: path.resolve(__dirname, '../src/web/master/index.html'),
          to: path.resolve(__dirname, '../lib/web/index.html')
        }
      ])
    ],
    module: {
      loaders: [{
          test: /\.jsx?$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
          query: {
            presets: ['es2015', 'stage-0', 'react'],
            plugins: ['transform-object-rest-spread'],
            compact: false
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
  })

  vendorCompiler.run(function(err, stats) {
    console.log(err ? 'vendor:ERROR' : 'vendor:SUCCESS');
    appCompiler.run(function(err, stats) {
      console.log(stats)
      if (err) console.log(err, err.message)
      console.log(err ? 'app:ERROR' : 'app:SUCCESS');
    })
  });


  // pack -> vendor
  // bootstrap
  // pack -> app
  // babel
};
