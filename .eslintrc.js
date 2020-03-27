module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: [
    'airbnb-base',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    'indent': ['error', 'tab'],
    'no-tabs': 'off',
    'no-async-promise-executor': 'off',
    'max-len': ['warn', {
      'code': 150
    }],
    'no-trailing-spaces': 'off',
    'prefer-promise-reject-errors': 'off',
    'no-multi-spaces': ['error', {
      'ignoreEOLComments': true,
    }],
    'space-before-function-paren': ['warn', {
      'anonymous': 'never',
      'named': 'always'
    }],
  },
};
