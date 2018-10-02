const exec = require('child_process').exec
const path = require('path')
const fse = require('fs-extra')
const gulp = require('gulp')

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

module.exports = {
  packageApp,
  copyData
}
