
const path = require('path');

// const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');

module.exports = {
    entry: {
        main: './src/index.tsx',
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
            {
                exclude: /node_modules/,
                test: /\.jsx?$/,
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env', '@babel/preset-react'],
                },
            },
            {
                exclude: /node_modules/,
                test: /\.ts$/,
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-typescript'],
                },
            },
            {
                exclude: /node_modules/,
                test: /\.tsx$/,
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
                },
            }
        ],
    },
    // comment this out in production mode it doesn't work for some reason
    // devtool: 'eval-source-map',
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        compress: true,
        port: 9000,
        hot: true,
        liveReload: true,
        watchFiles: ['src/**/*', 'dist/**/*'],
        devMiddleware: {
            writeToDisk: false,
        },
    },
    // plugins: [
    //     new BundleAnalyzerPlugin(),
    // ],
};
