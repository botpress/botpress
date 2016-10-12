var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: {
      vendor: ['react', 'react-bootstrap', 'axios', 'react-router', 'history', 'pubsub-js']
    },
    output: {
        path: path.resolve(__dirname, 'dist/js'),
        filename: '[name].dll.bundle.js',
        library: '[name]_dll'
    },
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    plugins: [
        new webpack.DllPlugin({
          path: path.join(__dirname, "dist/js", "[name]-manifest.json"),
          name: "[name]_dll"
        })
    ],
    module: {
        loaders: [{
            test: /\.jsx?$/,
            exclude: /node_modules/,
            loader: 'babel',
            query: {
                presets: ['es2015', 'react'],
                compact: false
            }
        }, {
            test: /\.css$/,
            loader: "style-loader!css-loader"
        }, {
            test: /\.woff|\.woff2|\.svg|.eot|\.ttf/,
            loader: 'url?prefix=font/&limit=10000'
        }]
    }
}
