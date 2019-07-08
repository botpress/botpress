const gulp = require('gulp')
const exec = require('child_process').exec
const rimraf = require('gulp-rimraf')
const { symlink } = require('gulp')
const yn = require('yn')

const verbose = process.argv.includes('--verbose')

const build = () => {
  gulp.task('build:studio', gulp.series([buildStudio, cleanStudio, cleanStudioAssets, copyStudio]))
  gulp.task('build:admin', gulp.series([buildAdmin, copyAdmin]))

  if (yn(process.env.GULP_PARALLEL)) {
    return gulp.parallel(['build:studio', 'build:admin'])
  }

  return gulp.series(['build:studio', 'build:admin'])
}

const buildStudio = cb => {
  const cmd = process.argv.includes('--prod') ? 'yarn && yarn build:prod --nomap' : 'yarn && yarn build'

  const studio = exec(cmd, { cwd: 'src/bp/ui-studio' }, err => cb(err))
  verbose && studio.stdout.pipe(process.stdout)
  studio.stderr.pipe(process.stderr)
}

const buildAdmin = cb => {
  const prod = process.argv.includes('--prod') ? '--nomap' : ''

  const admin = exec(`yarn && yarn build ${prod}`, { cwd: 'src/bp/ui-admin' }, err => cb(err))
  verbose && admin.stdout.pipe(process.stdout)
  admin.stderr.pipe(process.stderr)
}

const copyAdmin = () => {
  return gulp.src('./src/bp/ui-admin/build/**/*').pipe(gulp.dest('./out/bp/ui-admin/public'))
}

const cleanStudio = () => {
  return gulp.src('./out/bp/ui-studio/public', { allowEmpty: true }).pipe(rimraf())
}

const cleanStudioAssets = () => {
  return gulp.src('./out/bp/data/assets/ui-studio', { allowEmpty: true }).pipe(rimraf())
}

const copyStudio = () => {
  return gulp.src('./src/bp/ui-studio/public/**/*').pipe(gulp.dest('./out/bp/ui-studio/public'))
}

const createStudioSymlink = () => {
  return gulp.src('./src/bp/ui-studio/public').pipe(symlink('./out/bp/data/assets/ui-studio/', { type: 'dir' }))
}

const watchAdmin = cb => {
  const admin = exec('yarn && yarn start:dev', { cwd: 'src/bp/ui-admin' }, err => cb(err))
  admin.stdout.pipe(process.stdout)
  admin.stderr.pipe(process.stderr)
}

const watchStudio = cb => {
  const studio = exec('yarn && yarn watch', { cwd: 'src/bp/ui-studio' }, err => cb(err))
  studio.stdout.pipe(process.stdout)
  studio.stderr.pipe(process.stderr)
}

const watchAll = () => {
  return gulp.parallel([watchStudio, watchAdmin])
}

module.exports = {
  build,
  watchAll,
  watchStudio,
  watchAdmin,
  createStudioSymlink,
  cleanStudioAssets
}
