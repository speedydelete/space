
import path from 'path';
import fs from 'fs';
import minify from '@minify-html/node';
import babel from '@babel/core';
import webpack from 'webpack';

function afterWebpack(err, stats) {
    if (err) {
        console.log('error while running webpack:\n');
        console.error(err);
        return;
    }
    if (stats === undefined) {
        throw new Error('stats is undefined, this error should not happen');
    }
    fs.writeFileSync('dist/index.html', minify.minify(fs.readFileSync('src/index.html'), {
        keep_html_and_head_opening_tags: true,
    }));
    console.log(stats.toString({colors: true}) + '\n');
    for (let file of fs.readdirSync('dist')) {
        if (file.endsWith('.before_babel.js')) {
            let code = babel.transformSync(fs.readFileSync('dist/' + file), {
                presets: ['@babel/preset-env'],
                targets: '> 1%, not dead',
                minified: true,
            }).code;
            if (code.startsWith('"use strict";(()=>{"use strict";')) {
                code = code.slice(13);
            }
            fs.writeFileSync('dist/' + file.slice(0, -16) + '.js', code);
        }
    }
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
        path: path.resolve(import.meta.dirname, 'dist'),
        filename: '[name].before_babel.js',
    },
    devtool: mode === 'development' ? 'source-map' : undefined,
});

if (process.argv.includes('watch')) {
    compiler.watch({}, afterWebpack);
} else {
    compiler.run(afterWebpack);
}
