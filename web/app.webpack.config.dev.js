var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: {
        app: path.resolve(__dirname, 'master/jsx/App')
    },
    output: {
        path: path.resolve(__dirname, 'dist/js'),
        filename: '[name].dll.bundle.js'
    },
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    plugins: [
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.NoErrorsPlugin(),
        new webpack.DllReferencePlugin({
            context: __dirname,
            manifest: require(path.join(__dirname, 'dist/js', 'vendor-manifest.json')),
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
