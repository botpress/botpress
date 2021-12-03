const gulp = require('gulp')
const gulpif = require('gulp-if')
const run = require('gulp-run')
const fs = require('fs')
const { exec, spawn } = require('child_process')
const rimraf = require('rimraf')
require('bluebird-global')

const maybeFetchPro = () => {
  const isProBuild = process.env.EDITION === 'pro' || fs.existsSync('pro')
  return gulp.src('./').pipe(gulpif(isProBuild, run('git submodule update --init', { verbosity: 2 })))
}

const checkTranslations = cb => {
  const reorder = process.argv.find(x => x.toLowerCase() === '--reorder')
  exec(`node build/check-translations.js ${reorder && '--reorder'}`, (err, stdout, stderr) => {
    console.log(stdout, stderr)
    cb(err)
  })
}

const buildDownloader = cb => {
  const child = exec('yarn && yarn build', { cwd: 'build/downloader' }, err => cb(err))
  child.stdout.pipe(process.stdout)
  child.stderr.pipe(process.stderr)
}

const initDownloader = cb => {
  const proc = spawn('yarn', ['start', 'init'], { cwd: 'build/downloader', stdio: 'inherit', shell: true })
  proc.on('exit', (code, signal) =>
    cb(code !== 0 ? new Error(`Process exited with exit-code ${code} and signal ${signal}`) : undefined)
  )
}

const build = cb => {
  const child = exec('yarn && yarn build', { cwd: 'packages/bp' }, err => cb(err))
  child.stdout.pipe(process.stdout)
  child.stderr.pipe(process.stderr)
}

const watch = cb => {
  const child = exec('yarn watch', { cwd: 'packages/bp' }, err => cb(err))
  child.stdout.pipe(process.stdout)
  child.stderr.pipe(process.stderr)
}

const cleanup = async () => {
  await Promise.fromCallback(cb => rimraf('packages/bp/archives', cb))
  await Promise.fromCallback(cb => rimraf('packages/bp/binaries', cb))
  await Promise.fromCallback(cb => rimraf('**/dist/**', cb))
  await Promise.fromCallback(cb => rimraf('out', cb))
  await Promise.fromCallback(cb => rimraf('**/node_modules/**', cb))
}

module.exports = {
  build,
  watch,
  maybeFetchPro,
  checkTranslations,
  buildDownloader,
  initDownloader,
  cleanup
}
