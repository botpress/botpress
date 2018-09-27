const gulp = require('gulp')
const core = require('./build/gulp.core')
const modules = require('./build/gulp.modules')

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
    core.copyVanilla,
    core.copyAdmin,
    core.copyStudio,
    core.copyTempates
  ])
)

gulp.task(
  'dev',
  gulp.series([
    core.clean,
    core.buildTs,
    core.buildSchemas,
    core.createDirectories,
    core.copyVanilla,
    core.copyAdmin,
    core.copyStudio,
    core.copyTempates,
    core.watch
  ])
)

gulp.task('modules', gulp.series([modules.copySdkDefinitions, modules.copyBoilerplateFiles, modules.buildModules()]))
