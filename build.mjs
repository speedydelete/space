
import {resolve} from 'path';
import {writeFileSync} from 'fs';
import webpack from 'webpack';
import {minify} from 'minify';

async function afterWebpack(err, stats) {
    if (err) {
        console.log('error while running webpack:\n');
        console.error(err);
        return;
    }
    if (stats === undefined) {
        throw new Error('stats is undefined, this error should not happen');
    }
    writeFileSync('dist/index.html', await minify('src/index.html'));
    console.log(stats.toString({colors: true}) + '\n');
    if (!stats.hasErrors()) {
        console.log('build: complete');
    }
    if (compiler !== undefined && !compiler.watching) {
        compiler.close(() => {});
    }
}

let mode = process.argv.includes('dev') ? 'development' : 'production';

let compiler = webpack({
    mode: mode,
    entry: {
        main: './lib/index.js',
    },
    output: {
        path: resolve(import.meta.dirname, 'dist'),
        filename: '[name].js',
    },
    module: {
        rules: [
            {
                exclude: /node_modules/,
                test: /\.js$/,
                loader: 'babel-loader',
                options: {
                    presets: [
                        '@babel/preset-env',
                    ]
                },
            },
        ],
    },
    devtool: mode === 'development' ? 'source-map' : undefined,
});

if (process.argv.includes('watch')) {
    compiler.watch({}, afterWebpack);
} else {
    compiler.run(afterWebpack);
}
