const gulp = require('gulp')
const ts = require('gulp-typescript')
const rimraf = require('gulp-rimraf')
const run = require('gulp-run')

gulp.task('clean-all', () => {
  return gulp.src(['./node_modules', './out']).pipe(rimraf())
})

gulp.task('clean', () => {
  return gulp.src('./out').pipe(rimraf())
})

gulp.task('build-ts', () => {
  const tsProject = ts.createProject('./src/tsconfig.json')
  return gulp
    .src('./src/**/*.ts')
    .pipe(tsProject())
    .pipe(gulp.dest('./out'))
})

gulp.task('watch-ts', ['build-ts'], () => {
  return gulp.watch('./src/**/*.ts', ['build-ts'])
})

gulp.task('build-static', ['build-ts'], () => {
  return gulp.src('./src/bp/vanilla/**/*').pipe(gulp.dest('./out/bp/data'))
})

const botpressJsonSchemas =
  './node_modules/.bin/typescript-json-schema --required "src/bp/core/config/*.ts" BotpressConfig --out "out/botpress.config.schema.json" --ignoreErrors'
const botJsonSchemas =
  './node_modules/.bin/typescript-json-schema --required "src/bp/core/config/*.ts" BotConfig --out "out/bot.config.schema.json" --ignoreErrors'
gulp.task('build-schemas', ['build-ts'], () => {
  return gulp
    .src('.')
    .pipe(run(botpressJsonSchemas))
    .pipe(run(botJsonSchemas))
})

gulp.task('test', ['build-ts'], () => {
  return gulp.src('.').pipe(run('./node_modules/.bin/jest --detectOpenHandles -c ./jest.config.js'))
})

process.on('uncaughtException', err => {
  console.error('An error coccured in your gulpfile: ', err)
  process.exit(1)
})

gulp.task('default', ['clean', 'build-ts', 'build-schemas', 'build-static'])

gulp.task('dev', ['clean', 'build-schemas', 'build-static', 'watch-ts'])
