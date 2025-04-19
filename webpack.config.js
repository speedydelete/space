
const path = require('path');

// const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');

module.exports = {
    entry: {
        main: './lib/index.js',
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
    },
    resolve: {
        extensions: ['.html', '.js', '.jsx', '.ts', '.tsx'],
        modules: [path.resolve(__dirname, 'node_modules')],
    },
    module: {
        rules: [
            {
                exclude: /node_modules/,
                test: /\.js?$/,
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env'],
                },
            },
        ],
    },
};
