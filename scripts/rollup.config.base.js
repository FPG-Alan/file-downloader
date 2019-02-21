import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
// import typescript from 'rollup-plugin-typescript';
import alias from 'rollup-plugin-alias';
import replace from 'rollup-plugin-replace';
import { eslint } from 'rollup-plugin-eslint';
import postcss from 'rollup-plugin-postcss';

/*
 * offical image plugin is <rollup-plugin-image>, but this lib provide better experience, include
 * 1. auto decide to use base64 or url based on file size(8192 or customize by pass options)
 * 2. provide base64 or url as a string instead a HTML Image Object, more suitable for use in the React environment
 */
import image from 'rollup-plugin-img';

export default {
  input: 'src/index.ts',
  external: ['react', 'react-dom', 'antd'],
  plugins: [
    alias({
      resolve: ['.js']
      // mobx.module.js has error when parsed by rollup
      // Template literal(backtick) is used for fix issue with rollup-plugin-commonjs https://github.com/rollup/rollup-plugin-commonjs/issues/344
      // this patch was not actually applied to 'mobx.module.js'.
      // mobx: 'node_modules/mobx/lib/mobx.es6.js'
    }),
    image(),
    postcss({
      modules: true,
      extract: false
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    }),
    resolve({
      extensions: ['.js', '.ts', '.tsx']
    }),
    commonjs({
      include: ['node_modules/**'],
      /* exclude: [
                    'node_modules/mobx/lib/mobx.module.js'
                ], */
      namedExports: {
        'node_modules/react/index.js': ['Children', 'Component', 'PureComponent', 'Fragment', 'createElement'],
        'node_modules/react-dom/index.js': ['render', 'findDOMNode', 'unstable_batchedUpdates']
      }
    }),
    eslint({
      include: ['src/**/*.ts', 'src/**/*.tsx']
    }),
    // load any compilerOptions from tsconfig.json file by default.
    // passing options here directly overrides those options.

    /*
     * Only use babel for translate, because babel has plentiful plugins
     */
    // typescript(),

    babel({
      // babelrc: false,
      // presets: ['@babel/env', '@babel/react', ['@babel/typescript']],
      // plugins: [
      //   ['@babel/plugin-proposal-decorators', { legacy: true }],
      //   ['@babel/plugin-proposal-class-properties', { loose: true }]
      // ],
      // tell babel which type of files need be translate
      extensions: ['.js', '.ts', '.tsx'],
      include: ['src/**']
    })
  ]
};
