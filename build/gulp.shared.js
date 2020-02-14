const gulp = require('gulp')
const exec = require('child_process').exec
const rimraf = require('gulp-rimraf')

const build = () => {
  gulp.task('build:shared', gulp.series([buildShared, clean]))

  return gulp.series(['build:shared'])
}

const clean = () => {
  return gulp.src('./out/bp/ui-shared/dist', { allowEmpty: true }).pipe(rimraf())
}

const watch = cb => {
  const shared = exec('yarn && yarn start', { cwd: 'src/bp/ui-shared' }, err => cb(err))
  shared.stdout.pipe(process.stdout)
  shared.stderr.pipe(process.stderr)
}

const buildShared = cb => {
  const shared = exec('yarn && yarn build', { cwd: 'src/bp/ui-shared' }, err => cb(err))
  shared.stdout.pipe(process.stdout)
  shared.stderr.pipe(process.stderr)
}

module.exports = {
  watch,
  build
}
