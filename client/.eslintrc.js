module.exports = {
  "env": {
    "browser": true,
    "es6": false
  },
  "extends": [
    "eslint:recommended",
    "plugin:compat/recommended",
  ],
  "globals": {
    "Atomics": "readonly",
    "SharedArrayBuffer": "readonly",
    "io": "readonly",
  },
  "parserOptions": {
    "ecmaVersion": 2015
  },
  "rules": {
    "compat/compat": "warn",
    "no-unused-vars": "warn"
  }
};
