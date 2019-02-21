import baseConfig from './rollup.config.base';
import serve from 'rollup-plugin-serve';

import { name } from '../package.json';

export default {
  ...baseConfig,
  output: [
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
  ],
  plugins: [
    ...baseConfig.plugins,
    serve({
      port: 9000,
      contentBase: ['example']
    })
  ]
};
