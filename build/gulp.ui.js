const gulp = require('gulp')
const exec = require('child_process').exec
const rimraf = require('gulp-rimraf')
const { symlink } = require('gulp')
const yn = require('yn')

const build = () => {
  gulp.task('build:studio', gulp.series([buildStudio, cleanStudio, cleanStudioAssets, copyStudio]))
  gulp.task('build:admin', gulp.series([buildAdmin, copyAdmin]))

  if (yn(process.env.GULP_PARALLEL)) {
    return gulp.parallel(['build:studio', 'build:admin'])
  }

  return gulp.series(['build:studio', 'build:admin'])
}

const buildStudio = cb => {
  const src = 'src/bp/ui-studio'
  const cmd = process.argv.includes('--prod') ? 'yarn && yarn build:prod --nomap' : 'yarn && yarn build'
  exec(cmd, { cwd: src }, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr)
      return cb(err)
    }
    cb()
  })
}

const buildAdmin = cb => {
  const prod = process.argv.includes('--prod') ? '--nomap' : ''
  const src = 'src/bp/ui-admin'
  exec(`yarn && yarn build ${prod}`, { cwd: src }, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr)
      return cb(err)
    }
    cb()
  })
}

const copyAdmin = () => {
  return gulp.src('./src/bp/ui-admin/build/**/*').pipe(gulp.dest('./out/bp/ui-admin/public'))
}

const cleanStudio = () => {
  return gulp.src('./out/bp/ui-studio/public', { allowEmpty: true }).pipe(rimraf())
}

const cleanStudioAssets = () => {
  return gulp.src('./out/bp/assets/ui-studio/public', { allowEmpty: true }).pipe(rimraf())
}

const copyStudio = () => {
  return gulp.src('./src/bp/ui-studio/public/**/*').pipe(gulp.dest('./out/bp/ui-studio/public'))
}

const createStudioSymlink = () => {
  return gulp.src('./src/bp/ui-studio/public').pipe(symlink('./out/bp/assets/ui-studio/', { type: 'dir' }))
}

const watchAdmin = cb => {
  exec('yarn && yarn start:dev', { cwd: 'src/bp/ui-admin' }, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr)
      return cb(err)
    }
    cb()
  })
}

const watchStudio = cb => {
  exec('yarn && yarn watch', { cwd: 'src/bp/ui-studio' }, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr)
      return cb(err)
    }
    cb()
  })
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
