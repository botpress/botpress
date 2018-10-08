const exec = require('child_process').exec
const path = require('path')
const fse = require('fs-extra')
const gulp = require('gulp')
const glob = require('glob')
const mkdirp = require('mkdirp')
const fs = require('fs')

const promisify = require('util').promisify
const execAsync = promisify(exec)

const packageApp = async () => {
  const additionalPackageJson = require(path.resolve(__dirname, './package.pkg.json'))
  const realPackageJson = require(path.resolve(__dirname, '../package.json'))
  const tempPkgPath = path.resolve(__dirname, '../out/bp/package.json')
  const cwd = path.resolve(__dirname, '../out/bp')
  try {
    const packageJson = Object.assign(realPackageJson, additionalPackageJson)
    await fse.writeFile(tempPkgPath, JSON.stringify(packageJson, null, 2), 'utf8')
    await execAsync('../../node_modules/.bin/pkg --targets node10-macos-x64 --output ../binaries/bp ./package.json', {
      cwd
    })
  } catch (err) {
    console.error('Error running: ', err.cmd, '\nMessage: ', err.stderr, err)
  } finally {
    await fse.unlink(tempPkgPath)
  }
}

const copyData = () => {
  return gulp.src(['out/bp/data/**/*']).pipe(gulp.dest('out/binaries/data'))
}

const copyNativeExtensions = async () => {
  mkdirp.sync('out/binaries/bindings')
  const files = glob.sync('./node_modules/**/node-v64-*/*.node')

  for (const file of files) {
    fs.copyFileSync(path.resolve(file), path.resolve('./out/binaries/bindings/', path.basename(file)))
  }
}

module.exports = {
  packageApp,
  copyData,
  copyNativeExtensions
}
