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

    hints: {
      ignoreCoverage: 'istanbul ignore'
    },

    setup: function (wallaby) {
      wallaby.testFramework.ui('tdd')
    },

    delays: {
      run: 200
    }
  }
}
