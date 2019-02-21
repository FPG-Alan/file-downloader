import filesize from 'rollup-plugin-filesize';
import { uglify } from 'rollup-plugin-uglify';
import { minify } from 'uglify-es';

import baseConfig from './rollup.config.base';
import { name, version, author } from '../package.json';

// banner
const banner =
  `${'/*!\n' + ' * '}${name}.js v${version}\n` + ` * (c) 2018-${new Date().getFullYear()} ${author}\n` + ' * Released under the MIT License.\n' + ' */';

// 支持输出 []
export default [
  // .js, .cjs.js, .esm.js
  {
    ...baseConfig,
    output: [
      // umd development version with sourcemap
      {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          mobx: 'Mobx',
          'mobx-react': 'mobxReact',
          antd: 'antd',
          'date-fns': 'dateFns'
        },
        file: `dist/${name}.js`,
        format: 'umd',
        name,
        banner,
        sourcemap: true
      },
      // cjs and esm version
      {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          mobx: 'Mobx',
          'mobx-react': 'mobxReact',
          antd: 'antd',
          'date-fns': 'dateFns'
        },
        file: `dist/${name}.cjs.js`,
        format: 'cjs',
        banner
      },
      {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          mobx: 'Mobx',
          'mobx-react': 'mobxReact',
          antd: 'antd',
          'date-fns': 'dateFns'
        },
        file: `dist/${name}.esm.js`,
        format: 'es',
        banner
      }
    ],
    plugins: [...baseConfig.plugins, filesize()]
  },
  // .min.js
  {
    ...baseConfig,
    output: [
      // umd with compress version
      {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          mobx: 'Mobx',
          'mobx-react': 'mobxReact',
          antd: 'antd',
          'date-fns': 'dateFns'
        },
        file: `dist/${name}.min.js`,
        format: 'umd',
        name,
        banner
      }
    ],
    plugins: [
      ...baseConfig.plugins,
      uglify(
        {
          compress: {
            drop_console: true
          }
        },
        minify
      ),
      filesize()
    ]
  }
];
