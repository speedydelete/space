
const path = require('path');

module.exports = {
    entry: {
        index: './src/index.tsx',
        game: './src/game.ts',
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
    },
    resolve: {
        extensions: ['.html', '.js', '.ts', '.tsx'],
        modules: ['node_modules'],
    },
    module: {
        rules: [
            {
                exclude: /node_modules/,
                test: /\.[jt]sx?$/,
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
                },
            }
        ],
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        compress: true,
        port: 9000,
        hot: true,
        liveReload: true,
        watchFiles: ['src/**/*', 'editor/**/*'],
        devMiddleware: {
            writeToDisk: false,
        },
    },
};
