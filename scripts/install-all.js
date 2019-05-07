const fs = require('fs')
const path = require('path')
const spawn = require('child_process').spawn

// TODO: Use something to manage mono-repository instead (some alternatives to Lerna?)

// Configuration
const packagesDirectory = path.resolve(path.join(__dirname, '..', 'packages'))

// Set up helpers
const getPkgPath = name => path.join(packagesDirectory, name)

// Retrieve all packages
const packageNames = fs.readdirSync(packagesDirectory)
  .filter(name => fs.lstatSync(getPkgPath(name)).isDirectory())

// Find out which of these have 'package.json' to install
const installablePackageNames = packageNames.filter(
  name => fs.existsSync(path.join(getPkgPath(name), 'package.json'))
)

// Formatting

const maxLength = Math.max.apply(Math, installablePackageNames.map(x => x.length))

function getSpace (name) {
  return ' '.repeat(name.length - maxLength)
}

function writeConsole (stream, banner, data) {
  stream.write(banner)

  stream.write(
    data.toString()
      .replace(/\n*$/, '')
      .replace(/\n/g, '\n' + banner)
    + '\n'
  )
}

// Install each of them

function installPackage (name) {
  const bin = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const pkgPath = getPkgPath(name)
  const shortPkgPath = './' + path.relative(path.resolve(__dirname, '..'), pkgPath)
  const child = spawn(bin, [ 'install' ].concat(process.argv.slice(2)), { cwd: pkgPath })

  const useColors = !process.env.CI
  const _banner = '[' + name + ']' + getSpace(name) + ' '

  const banner = useColors ? '\x1b[36m' + _banner + '\x1b[0m' : _banner
  const startBanner = useColors ? '\x1b[32m' + _banner + '\x1b[0m' : _banner
  const errorBanner = useColors ? '\x1b[31m' + _banner + '\x1b[0m' : _banner

  writeConsole(process.stdout, startBanner, 'Running "' + bin + '" in "' + shortPkgPath + '"')

  child.stdout.on('data', data => {
    writeConsole(process.stdout, banner, data)
  })

  child.stderr.on('data', data => {
    writeConsole(process.stderr, errorBanner, data)
  })

  return new Promise((resolve, reject) => {
    child.on('close', code => {
      if (code === 0) {
        resolve()
      } else {
        reject()
      }
    })
  })
}

// Start installing all of them
const promises = installablePackageNames.map(installPackage)

// Handle errors
Promise.all(promises)
  .catch(() => process.exit(1))
