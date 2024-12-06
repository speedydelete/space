
const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/index.ts',
    output: {
        filename: 'main.js',
        publicPath: '/',
        path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
        extensions: ['.js', '.ts', '.html', '.css', '.json'],
        modules: ['node_modules'],
    },
    module: {
        rules: [
            {
                exclude: /node_modules/,
                test: /\.[jt]s$/,
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env', '@babel/preset-typescript'],
                },
            },
            {
                exclude: /node_modules/,
                test: /\.[jt]s$/,
                use: ['source-map-loader'],
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'src'),
        },
        compress: true,
        port: 9000,
        hot: true, // Enable HMR
        liveReload: true,
        watchFiles: ['src/**/*', 'editor/**/*'], // Avoid watching the dist directory
        devMiddleware: {
            writeToDisk: true, // Ensure changes are written to disk
        },
    },
};
