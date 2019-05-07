const Benchmark = require('benchmark')
const glob = require('glob')
const path = require('path')

// create benchmark suite
const suite = new Benchmark.Suite()

// Load all test cases
const variants = glob.sync(path.join(__dirname, 'cases/*.js'))

// Register all test cases
for (const variant of variants) {
  // Retrieve test name
  const name = variant.match(/[/\\]([^/\\]+)\.js/)[1]

  // Register test
  suite.add(name, require(variant))
}

// Emit results
suite.on('cycle', event => console.log(event.target.toString()))

// Start benchmark
suite.run()
