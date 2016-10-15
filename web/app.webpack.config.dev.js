var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin')

var extractCssPlugin = new ExtractTextPlugin('../css/app.custom.css', {
  allChunks: true
})

module.exports = {
    entry: {
        app: path.resolve(__dirname, 'master/jsx/App')
    },
    output: {
        path: path.resolve(__dirname, 'dist/js'),
        filename: '[name].dll.bundle.js'
    },
    resolve: {
        extensions: ['', '.js', '.jsx'],
        alias: {
            '~': __dirname
        }
    },
    plugins: [
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.NoErrorsPlugin(),
        new webpack.DllReferencePlugin({
            context: __dirname,
            manifest: require(path.join(__dirname, 'dist/js', 'vendor-manifest.json')),
        }),
        extractCssPlugin
    ],
    module: {
        loaders: [{
            test: /\.jsx?$/,
            exclude: /node_modules/,
            loader: 'babel',
            query: {
                presets: ['es2015', 'react'],
                plugins: ['transform-object-rest-spread'],
                compact: false
            }
        }, {
            test: /\.css$/,
            loader: ExtractTextPlugin.extract(
              'style-loader',
              'css-loader?sourceMap&modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]'
            )
        }, {
            test: /\.woff|\.woff2|\.svg|.eot|\.ttf/,
            loader: 'url?prefix=font/&limit=10000'
        }, {
            test: /\.json$/,
            loader: "json-loader"
        }]
    }
}
