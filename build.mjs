
import path from 'path';
import fs from 'fs';
import {minify} from 'minify';
import webpack from 'webpack';

async function afterWebpack(err, stats) {
    if (err) {
        console.error(err);
        return;
    }
    console.log(stats.toString({colors: true}));
    if (!stats.hasErrors()) {
        let code = fs.readFileSync('src/index.html').toString();
        let css = fs.readFileSync('src/style.css').toString();
        code = code.replace('<link rel="stylesheet" href="style.css" />', '<style>' + css + '</style>');
        fs.writeFileSync('dist/index.html', code);
        fs.writeFileSync('dist/index.html', await minify('dist/index.html'));
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
        environment: {
            arrowFunction: false,
            asyncFunction: false,
            bigIntLiteral: false,
            const: false,
            destructuring: false,
            dynamicImport: false,
            dynamicImportInWorker: false,
            forOf: false,
            globalThis: false,
            module: false,
            optionalChaining: false,
            templateLiteral: false,
        },
    },
    resolve: {
        extensions: ['.js', '.ts'],
    },
    module: {
        rules: [
            {
                test: /\.[jt]s$/,
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-typescript', '@babel/preset-env'],
                    plugins: [
                        function ({types: t}) {
                            return {
                                visitor: {
                                    BigIntLiteral(path) {
                                        path.replaceWith(t.callExpression(t.identifier('BigInt'), [t.stringLiteral(path.node.value)]));
                                    }
                                }
                            };
                        }
                    ],
                    targets: {
                        chrome: '8',
                        edge: '12',
                        safari: '5.1',
                        firefox: '4',
                        opera: '12.1',
                        ie: '11',
                    },
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
