const path = require('path')
const gulp = require('gulp')
const ts = require('gulp-typescript')
const rimraf = require('rimraf')
const run = require('gulp-run')

const buildJsonSchemas = require('./jsonschemas')
const tsProject = ts.createProject(path.resolve(__dirname, '../src/tsconfig.json'))

const wipe = () => {
  return gulp.src(['./node_modules', './out']).pipe(rimraf())
}

const clean = cb => {
  rimraf('./out', cb)
}

const buildTs = () => {
  return tsProject
    .src()
    .pipe(tsProject())
    .pipe(gulp.dest('./out/bp'))
}

const watch = () => {
  return gulp.watch('./src/**/*.ts', buildTs)
}

const createDirectories = () => {
  return gulp
    .src('*.*', { read: false })
    .pipe(gulp.dest('./out/bp/data'))
    .pipe(gulp.dest('./out/bp/data/storage'))
}

const copyVanilla = () => {
  return gulp.src('./src/bp/vanilla/**/*').pipe(gulp.dest('./out/bp/data'))
}

const copyTempates = () => {
  return gulp.src('./src/templates/**/*').pipe(gulp.dest('./out/templates'))
}

const copyAdmin = () => {
  return gulp.src('./src/bp/ui-admin/build/**/*').pipe(gulp.dest('./out/bp/ui-admin/public'))
}

const copyStudio = () => {
  return gulp.src('./src/bp/ui-studio/static/**/*').pipe(gulp.dest('./out/bp/ui-studio/static'))
}

const buildSchemas = () => {
  return Promise.resolve(() => {
    buildJsonSchemas()
  })
}

const runTests = () => {
  return gulp.src('.').pipe(run('./node_modules/.bin/jest --detectOpenHandles -c ./jest.config.js'))
}

module.exports = {
  clean,
  buildTs,
  buildSchemas,
  createDirectories,
  copyVanilla,
  copyAdmin,
  copyStudio,
  copyTempates,
  watch,
  wipe,
  runTests
}
