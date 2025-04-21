
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
    console.log(stats.toString({colors: true}) + '\n');
    let code = fs.readFileSync('src/index.html').toString();
    code = code.replace('<link rel="stylesheet" href="style.css" />', '<style>' + fs.readFileSync('src/style.css') + '</style>');
    code = minify.minify(Buffer.from(code), {
        keep_html_and_head_opening_tags: true,
    });
    fs.writeFileSync('dist/index.html', code);
    for (let file of fs.readdirSync('dist')) {
        if (file.endsWith('.before_babel.js')) {
            let {code, map} = babel.transformSync(fs.readFileSync('dist/' + file), {
                presets: ['@babel/preset-env'],
                targets: '> 1%, not dead',
                sourceMaps: true,
                minified: true,
                comments: mode !== 'development',
                filename: file.slice(0, -16) + '.js',
            });
            if (code.match(/^"use strict";(\/\*.*?\*\/)?\(\(\)=>{"use strict";/)) {
                code = code.slice(13);
            }
            let outFile = 'dist/' + file.slice(0, -16) + '.js';
            if (mode === 'development') {
                code += '//# sourceMappingURL=/' + outFile + '.map';
                fs.writeFileSync(outFile + '.map', JSON.stringify(map));
            }
            fs.writeFileSync(outFile, code);
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
    module: {
        rules: [
            {
                test: /\.js$/,
                use: ['source-map-loader'],
            },
        ],
    },
    devtool: mode === 'development' ? 'eval-source-map' : undefined,
});

if (process.argv.includes('watch')) {
    compiler.watch({}, afterWebpack);
} else {
    compiler.run(afterWebpack);
}
