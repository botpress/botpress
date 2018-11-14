const core = require('./build/gulp.core')
const modules = require('./build/gulp.modules')
const package = require('./build/gulp.package')
const gulp = require('gulp')
const ui = require('./build/gulp.ui')
const docs = require('./build/gulp.docs')

process.on('uncaughtException', err => {
  console.error('An error occured in your gulpfile: ', err)
  process.exit(1)
})

gulp.task('watch', gulp.parallel([ui.watchStudio(), ui.watchAdmin]))
gulp.task('watch:studio', ui.watchStudio())
gulp.task('watch:admin', ui.watchAdmin)
gulp.task('build:ui', ui.build())
gulp.task('start:guide', docs.startDevServer)
gulp.task('build:guide', docs.buildGuide)
gulp.task('build:reference', docs.buildReference)
gulp.task('build', gulp.series([core.build(), modules.build(), ui.build()]))
gulp.task('build:core', core.build())
gulp.task('watch:core', core.watch)
gulp.task('package:core', package.packageCore())
gulp.task(
  'package',
  gulp.series([
    package.packageApp,
    ...(process.argv.includes('--skip-modules') ? [] : [modules.packageModules()]),
    package.copyData,
    package.copyTemplates,
    package.copyNativeExtensions
  ])
)
gulp.task('build:modules', modules.build())

// gulp.task('create-studio-symlink', gulp.series([core.cleanStudioAssets, core.cleanStudio, core.createStudioSymlink]))
