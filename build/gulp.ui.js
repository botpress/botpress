const gulp = require('gulp')
const exec = require('child_process').exec
const rimraf = require('gulp-rimraf')
const yn = require('yn')

const verbose = process.argv.includes('--verbose')

const build = () => {
  gulp.task('build:shared', gulp.series([cleanShared, sharedBuild]))
  gulp.task('build:admin', gulp.series([buildAdmin, cleanAdmin, copyAdmin]))
  gulp.task('build:lite', gulp.series([buildLite, cleanLite, copyLite]))

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

  const admin = exec(`yarn && yarn build ${prod}`, { cwd: 'src/bp/admin/ui' }, err => cb(err))
  verbose && admin.stdout.pipe(process.stdout)
  admin.stderr.pipe(process.stderr)
}

const copyAdmin = () => {
  return gulp.src('./src/bp/admin/ui/build/**/*').pipe(gulp.dest('./out/bp/admin/ui/public'))
}

const buildLite = cb => {
  const prod = process.argv.includes('--prod') ? '--nomap --prod' : ''

  const admin = exec(`yarn && yarn build ${prod}`, { cwd: 'src/bp/ui-lite' }, err => cb(err))
  verbose && admin.stdout.pipe(process.stdout)
  admin.stderr.pipe(process.stderr)
}

const cleanLite = () => {
  return gulp.src('./out/bp/ui-lite/public', { allowEmpty: true }).pipe(rimraf())
}

const copyLite = () => {
  return gulp.src('./src/bp/ui-lite/public/**/*').pipe(gulp.dest('./out/bp/ui-lite/public'))
}

const cleanAdmin = () => {
  return gulp.src('./out/bp/admin/ui/public', { allowEmpty: true }).pipe(rimraf())
}

const watchAdmin = cb => {
  const admin = exec('yarn && yarn start', { cwd: 'src/bp/admin/ui' }, err => cb(err))
  admin.stdout.pipe(process.stdout)
  admin.stderr.pipe(process.stderr)
}

const cleanShared = () => {
  return gulp.src('./out/bp/ui-shared/dist', { allowEmpty: true }).pipe(rimraf())
}

const watchShared = gulp.series([
  cleanShared,
  cb => {
    const shared = exec('yarn && yarn watch', { cwd: 'src/bp/ui-shared' }, err => cb(err))
    shared.stdout.pipe(process.stdout)
    shared.stderr.pipe(process.stderr)
  }
])

const sharedLiteBuild = cb => {
  const shared = exec('yarn', { cwd: 'src/bp/ui-shared-lite' }, err => cb(err))
  shared.stdout.pipe(process.stdout)
  shared.stderr.pipe(process.stderr)
}

const sharedBuild = cb => {
  const shared = exec('yarn && yarn build', { cwd: 'src/bp/ui-shared' }, err => cb(err))
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
