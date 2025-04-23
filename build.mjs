
import path from 'path';
import fs from 'fs';
import minify from '@minify-html/node';
import webpack from 'webpack';

function afterWebpack(err, stats) {
    if (err) {
        console.error(err);
        return;
    }
    console.log(stats.toString({colors: true}));
    if (!stats.hasErrors()) {
        let code = fs.readFileSync('src/index.html').toString();
        code = code.replace('<link rel="stylesheet" href="style.css" />', '<style>' + fs.readFileSync('src/style.css') + '</style>');
        code = minify.minify(Buffer.from(code), {
            keep_html_and_head_opening_tags: true,
        });
        fs.writeFileSync('dist/index.html', code);
        console.log('index.html compiled');
    }
    if (compiler !== undefined && !compiler.watching) {
        compiler.close(() => {});
    }
}

let mode = process.argv.includes('dev') ? 'development' : 'production';

let compiler = webpack({
    mode: mode,
    entry: {
        main: './src/index.ts',
    },
    output: {
        path: path.resolve(import.meta.dirname, 'dist'),
        filename: '[name].js',
    },
    resolve: {
        extensions: ['.js', '.ts'],
    },
    module: {
        rules: [
            {
                test: /\.[jt]s$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-typescript', '@babel/preset-env'],
                    targets: '> 0.5%, not dead',
                }
            },
        ],
    },
    devtool: mode === 'development' ? 'inline-source-map' : undefined,
});

if (process.argv.includes('watch')) {
    compiler.watch({}, afterWebpack);
} else {
    compiler.run(afterWebpack);
}
