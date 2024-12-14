
const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/index.tsx',
    output: {
        filename: 'main.js',
        publicPath: '/',
        path: path.resolve(__dirname, 'dist'),
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
