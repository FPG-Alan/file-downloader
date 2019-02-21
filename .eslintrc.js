module.exports = {
  parser: '@typescript-eslint/parser',
  env: {
    browser: true,
    commonjs: true,
    es6: true
  },
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  plugins: ['react', 'prettier', 'typescript'],
  rules: {
    'no-console': 'off',
    indent: 'off',
    'linebreak-style': ['off', 'unix', 'win'],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'prettier/prettier': 'error',
    'react/jsx-uses-react': 1,
    'react/jsx-uses-vars': 1,
    'react/jsx-indent': 'off',

    // 禁止使用未定义的变量
    // @off 接口定义会报错
    'no-undef': 'off',

    // 定义过的变量必须使用
    'no-unused-vars': 0,

    // 定义过的变量必须使用
    // eslint 原生的 no-unused-vars 无法使用，需要使用 typescript/no-unused-vars
    'typescript/no-unused-vars': 'error'
  },
  // 以当前目录为根目录，不再向上查找 .eslintrc.js
  root: true
};
