const core = require('./build/gulp.core')
const modules = require('./build/gulp.modules')
const package = require('./build/gulp.package')
const gulp = require('gulp')
const ui = require('./build/gulp.ui')
const docs = require('./build/gulp.docs')
const rimraf = require('rimraf')

process.on('uncaughtException', err => {
  console.error('An error occurred in your gulpfile: ', err)
  process.exit(1)
})

gulp.task('build', gulp.series([core.build(), modules.build(), ui.build()]))
gulp.task('build:ui', ui.build())
gulp.task('build:core', core.build())
gulp.task('build:modules', gulp.series([modules.build()]))

gulp.task('start:guide', docs.startDevServer)
gulp.task('build:guide', docs.buildGuide)
gulp.task('build:reference', docs.buildReference())

gulp.task('package:core', package.packageCore())
gulp.task(
  'package',
  gulp.series([
    package.packageApp,
    modules.packageModules(),
    package.copyData,
    package.copyTemplates,
    package.copyNativeExtensions
  ])
)

gulp.task('watch', gulp.parallel([core.watch, ui.watchAll()]))
gulp.task('watch:core', core.watch)
gulp.task('watch:studio', ui.watchStudio)
gulp.task('watch:admin', ui.watchAdmin)

gulp.task('clean:node', cb => rimraf('**/node_modules/**', cb))
gulp.task('clean:out', cb => rimraf('out', cb))
