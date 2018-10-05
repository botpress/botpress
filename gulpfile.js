const gulp = require('gulp')
const core = require('./build/gulp.core')
const modules = require('./build/gulp.modules')
const package = require('./build/gulp.package')

process.on('uncaughtException', err => {
  console.error('An error coccured in your gulpfile: ', err)
  process.exit(1)
})

gulp.task('test', gulp.series([core.buildTs, core.runTests]))

gulp.task(
  'default',
  gulp.series([
    core.clean,
    core.buildTs,
    core.buildSchemas,
    core.createDirectories,
    core.copyGlobal,
    core.copyAdmin,
    core.copyStudio,
    core.copyTemplates
  ])
)

gulp.task(
  'dev',
  gulp.series([
    core.clean,
    core.buildTs,
    core.buildSchemas,
    core.createDirectories,
    core.copyGlobal,
    core.copyAdmin,
    core.copyStudio,
    core.copyTemplates,
    core.watch
  ])
)

gulp.task('modules', gulp.series([modules.copySdkDefinitions, modules.copyBoilerplateFiles, modules.buildModules()]))

gulp.task('package', gulp.series(package.packageApp, modules.packageModules(), package.copyData))
