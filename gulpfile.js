const gulp = require('gulp')
const ts = require('gulp-typescript')
const rimraf = require('gulp-rimraf')
const run = require('gulp-run')

const tsProject = ts.createProject('./src/tsconfig.json')
const buildJsonSchemas = require('./build/jsonschemas')

const wipe = () => {
  return gulp.src(['./node_modules', './out']).pipe(rimraf())
}

const clean = () => {
  const folder = './out'
  return gulp.src(folder, { read: false, allowEmpty: true }).pipe(rimraf())
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

const copyStatic = () => {
  return gulp.src('./src/bp/vanilla/**/*').pipe(gulp.dest('./out/bp/data'))
}

const buildSchemas = () => {
  return Promise.resolve(() => {
    buildJsonSchemas()
  })
}

const runTests = () => {
  return gulp.src('.').pipe(run('./node_modules/.bin/jest --detectOpenHandles -c ./jest.config.js'))
}

process.on('uncaughtException', err => {
  console.error('An error coccured in your gulpfile: ', err)
  process.exit(1)
})

gulp.task('test', gulp.series([buildTs, runTests]))
gulp.task('default', gulp.series([clean, buildTs, buildSchemas, createDirectories, copyStatic]))
gulp.task('dev', gulp.series([(clean, buildSchemas, createDirectories, copyStatic, watch)]))
