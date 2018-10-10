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
    ...(process.argv.includes('--skip-clean') ? [] : [core.clean]),
    core.buildTs,
    core.buildSchemas,
    core.createDirectories,
    core.copyData,
    core.copyBotTemplate,
    core.copyAdmin,
    core.copyStudio
  ])
)

gulp.task(
  'dev',
  gulp.series([
    core.clean,
    core.buildTs,
    core.buildSchemas,
    core.createDirectories,
    core.copyData,
    core.copyBotTemplate,
    core.copyAdmin,
    core.copyStudio,
    core.watch
  ])
)

gulp.task('clean', core.clean)

gulp.task('modules', gulp.series([modules.copySdkDefinitions, modules.copyBoilerplateFiles, modules.buildModules()]))

gulp.task(
  'package',
  gulp.series([
    package.packageApp,
    ...(process.argv.includes('--skip-modules') ? [] : [modules.packageModules()]),
    package.copyData,
    package.copyNativeExtensions
  ])
)
