const exec = require('child_process').exec
const path = require('path')
const fse = require('fs-extra')
const gulp = require('gulp')
const glob = require('glob')
const mkdirp = require('mkdirp')
const fs = require('fs')

const promisify = require('util').promisify
const execAsync = promisify(exec)

const getTargetOSNodeVersion = () => {
  if (process.argv.find(x => x.toLowerCase() === '--win32')) {
    return 'node10-win32-x64'
  } else if (process.argv.find(x => x.toLowerCase() === '--linux')) {
    return 'node10-linux-x64'
  } else {
    return 'node10-macos-x64'
  }
}

const getTargetOSName = () => {
  if (process.argv.find(x => x.toLowerCase() === '--win32')) {
    return 'windows'
  } else if (process.argv.find(x => x.toLowerCase() === '--linux')) {
    return 'linux'
  } else {
    return 'darwin'
  }
}

const packageApp = async () => {
  const additionalPackageJson = require(path.resolve(__dirname, './package.pkg.json'))
  const realPackageJson = require(path.resolve(__dirname, '../package.json'))
  const tempPkgPath = path.resolve(__dirname, '../out/bp/package.json')
  const cwd = path.resolve(__dirname, '../out/bp')
  try {
    const packageJson = Object.assign(realPackageJson, additionalPackageJson)
    await fse.writeFile(tempPkgPath, JSON.stringify(packageJson, null, 2), 'utf8')
    await execAsync(
      `cross-env ../../node_modules/.bin/pkg --targets ${getTargetOSNodeVersion()} --output ../binaries/bp ./package.json`,
      {
        cwd
      }
    )
  } catch (err) {
    console.error('Error running: ', err.cmd, '\nMessage: ', err.stderr, err)
  } finally {
    await fse.unlink(tempPkgPath)
  }
}

const copyNativeExtensions = async () => {
  const files = [
    ...glob.sync('./build/native-extensions/*.node'),
    ...glob.sync('./node_modules/**/node-v64-*/*.node'),
    ...glob.sync(`./build/native-extensions/${getTargetOSName()}/**/*.node`)
  ]

  mkdirp.sync('./out/binaries/bindings/')

  for (const file of files) {
    if (file.indexOf(path.join('native-extensions', getTargetOSName()).replace('\\', '/')) > 0) {
      const dist = path.basename(path.dirname(file))
      const targetDir = `./out/binaries/bindings/${getTargetOSName()}/${dist}`
      mkdirp.sync(path.resolve(targetDir))
      fs.copyFileSync(path.resolve(file), path.resolve(targetDir, path.basename(file)))
    } else {
      fs.copyFileSync(path.resolve(file), path.resolve('./out/binaries/bindings/', path.basename(file)))
    }
  }
}

const packageCore = () => gulp.series([copyNativeExtensions, packageApp])

const package = modules => {
  return gulp.series([
    package.packageApp,
    ...(process.argv.includes('--skip-modules') ? [] : modules),
    package.copyNativeExtensions
  ])
}

module.exports = {
  packageCore,
  packageApp,
  copyNativeExtensions
}
