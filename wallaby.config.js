module.exports = function () {
  return {
    files: [
      'packages/*/src/**/*.js',
      { pattern: 'packages/*/tests/**/*.js', load: false, instrument: false },
      '!packages/*/tests/**/*.spec.js'
    ],

    tests: [
      'packages/*/tests/**/*.spec.js'
    ],

    env: {
      type: 'node',
      runner: 'node'
    },

    setup: function (wallaby) {
      wallaby.testFramework.ui('tdd')
    }
  }
}
