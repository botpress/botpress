const gulp = require('gulp')
const exec = require('child_process').exec
const rimraf = require('gulp-rimraf')
const { symlink } = require('gulp')

const build = () => {
  // gulp.task('build:studio', buildStudio)
  // gulp.task('build:admin', buildAdmin)
  return gulp.series([buildStudio, buildAdmin])
}

const buildStudio = cb => {
  const src = 'src/bp/ui-studio'
  exec('yarn && yarn build', { cwd: src }, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr)
      return cb(err)
    }
    cb()
  })
}

const buildAdmin = cb => {
  const src = 'src/bp/ui-admin'
  exec('yarn && yarn build', { cwd: src }, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr)
      return cb(err)
    }
    cb()
  })
}

const copyAssets = () => {
  return gulp.series([copyAdmin, cleanStudio, cleanStudioAssets, copyStudio])
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

module.exports = {
  build,
  copyAssets
}
