import baseConfig from './rollup.config.base';
import serve from 'rollup-plugin-serve';

import { name, version, author } from '../package.json';

const banner = `${'/*!\n' + ' * '}${name}.js v${version}\n` + ` * (c) 2018-${new Date().getFullYear()} ${author}\n` + ' * Released under the MIT License.\n' + ' */';
export default {
  ...baseConfig,
  /* output: [
    {
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        antd: 'antd'
      },
      file: `example/${name}.js`,
      format: 'umd',
      name,
      sourcemap: true
    }
  ], */
  output: [
    {
      file: `dist/${name}.esm.js`,
      format: 'es',
      name,
      banner,
      sourcemap: true
    }
  ],
  plugins: [
    ...baseConfig.plugins,
    serve({
      port: 9000,
      contentBase: ['example']
    })
  ]
};
