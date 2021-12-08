const gulp = require('gulp')
const exec = require('child_process').exec
const rimraf = require('gulp-rimraf')
const yn = require('yn')

const verbose = process.argv.includes('--verbose')

const build = () => {
  gulp.task('build:shared', gulp.series([cleanShared, sharedBuild]))
  gulp.task('build:admin', buildAdmin)
  gulp.task('build:lite', buildLite)

  if (yn(process.env.GULP_PARALLEL)) {
    return gulp.series(['build:shared', gulp.parallel(['build:admin', 'build:lite'])])
  }

  return gulp.series(['build:shared', 'build:admin', 'build:lite'])
}

const buildSharedLite = () => {
  gulp.task('build:sharedLite', gulp.series([sharedLiteBuild]))

  return gulp.series(['build:sharedLite'])
}

const buildShared = () => {
  gulp.task('build:shared', gulp.series([cleanShared, sharedBuild]))

  return gulp.series(['build:shared'])
}

const buildAdmin = cb => {
  const prod = process.argv.includes('--prod') ? '--nomap --prod' : ''

  const admin = exec(`yarn && yarn build ${prod}`, { cwd: 'packages/ui-admin' }, err => cb(err))
  verbose && admin.stdout.pipe(process.stdout)
  admin.stderr.pipe(process.stderr)
}

const buildLite = cb => {
  const prod = process.argv.includes('--prod') ? '--nomap --prod' : ''

  const admin = exec(`yarn && yarn build ${prod}`, { cwd: 'packages/ui-lite' }, err => cb(err))
  verbose && admin.stdout.pipe(process.stdout)
  admin.stderr.pipe(process.stderr)
}

const watchAdmin = cb => {
  const admin = exec('yarn && yarn start', { cwd: 'packages/ui-admin' }, err => cb(err))
  admin.stdout.pipe(process.stdout)
  admin.stderr.pipe(process.stderr)
}

const cleanShared = () => {
  return gulp.src('./packages/bp/dist/ui-shared/dist', { allowEmpty: true }).pipe(rimraf())
}

const watchShared = gulp.series([
  cleanShared,
  cb => {
    const shared = exec('yarn && yarn watch', { cwd: 'packages/ui-shared' }, err => cb(err))
    shared.stdout.pipe(process.stdout)
    shared.stderr.pipe(process.stderr)
  }
])

const sharedLiteBuild = cb => {
  const shared = exec('yarn', { cwd: 'packages/ui-shared-lite' }, err => cb(err))
  shared.stdout.pipe(process.stdout)
  shared.stderr.pipe(process.stderr)
}

const sharedBuild = cb => {
  const shared = exec('yarn && yarn build', { cwd: 'packages/ui-shared' }, err => cb(err))
  shared.stdout.pipe(process.stdout)
  shared.stderr.pipe(process.stderr)
}

const watchAll = gulp.parallel([watchShared, watchAdmin])

module.exports = {
  build,
  watchAll,
  watchAdmin,
  watchShared,
  buildSharedLite,
  buildShared
}
