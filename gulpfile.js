const gulp = require('gulp')
const core = require('./build/gulp.core')
const modules = require('./build/gulp.modules')
const package = require('./build/gulp.package')

process.on('uncaughtException', err => {
  console.error('An error coccured in your gulpfile: ', err)
  process.exit(1)
})

const dataTasks = [core.createDirectories, core.copyData, core.copyBotTemplate]
const uiTasks = [core.copyAdmin, core.copyStudio]
const buildTasks = [core.fetchPro, core.writeEdition, core.buildTs, core.buildSchemas, ...dataTasks, ...uiTasks]

gulp.task('copy-admin', core.copyAdmin)
gulp.task('build-reference', core.buildReferenceDoc)
gulp.task('clean-build', gulp.series([core.clean, ...buildTasks]))
gulp.task('clean-build-watch', gulp.series([core.clean, ...buildTasks, core.watch]))
gulp.task('build-watch', gulp.series([...buildTasks, core.watch]))
gulp.task('watch', core.watch)
gulp.task('clean', core.clean)
gulp.task('modules', gulp.series([modules.copySdkDefinitions, modules.copyBoilerplateFiles, modules.buildModules()]))
gulp.task('package:core', gulp.series([
  package.packageApp,
  package.copyData,
  package.copyTemplates,
  package.copyNativeExtensions
]))
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
