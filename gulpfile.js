const gulp = require('gulp')
const ts = require('gulp-typescript')
const rimraf = require('gulp-rimraf')
const run = require('gulp-run')
const ignore = require('gulp-ignore')

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
  process.exit(1)
})

gulp.task('clean-all', () => gulp.src('./out').pipe(rimraf()))

gulp.task('clean', () => {
  return gulp
    .src('./out')
    .pipe(ignore('node_modules/**'))
    .pipe(rimraf())
})

gulp.task('build-ts', () => {
  const tsProject = ts.createProject('./src/tsconfig.json')
  return gulp
    .src('./src/**/*.ts')
    .pipe(tsProject())
    .pipe(gulp.dest('./out'))
})

gulp.task('serve', () => {
  return run('cd ./out/bp && NODE_PATH=./ node index.js').exec()
})

gulp.task('watch-ts', ['build-ts'], () => {
  return gulp.watch('./src/**/*.ts', ['build-ts'])
})

gulp.task('static', ['build-ts'], () => {
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

gulp.task('default', ['clean-all', 'build-ts', 'build-schemas', 'static'])

gulp.task('dev', ['clean', 'build-schemas', 'static', 'watch-ts', 'serve'])
