const core = require('./build/gulp.core')
const modules = require('./build/gulp.modules')
const package = require('./build/gulp.package')
const gulp = require('gulp')
const ui = require('./build/gulp.ui')
const docs = require('./build/gulp.docs')
const rimraf = require('rimraf')
const changelog = require('gulp-conventional-changelog')
const yn = require('yn')

process.on('uncaughtException', err => {
  console.error('An error occurred in your gulpfile: ', err)
  process.exit(1)
})

if (yn(process.env.GULP_PARALLEL)) {
  gulp.task('build', gulp.series([core.build(), gulp.parallel(modules.build(), ui.build())]))
} else {
  gulp.task('build', gulp.series([core.build(), modules.build(), ui.build()]))
}

gulp.task('build:ui', ui.build())
gulp.task('build:core', core.build())
gulp.task('build:modules', gulp.series([modules.build()]))
gulp.task('build:sdk', gulp.series([modules.buildSdk()]))

gulp.task('start:guide', docs.startDevServer)
gulp.task('build:guide', docs.buildGuide)
gulp.task('build:reference', docs.buildReference())

gulp.task('package:core', package.packageCore())
gulp.task('package', gulp.series([package.packageApp, modules.packageModules(), package.copyNativeExtensions]))

gulp.task('watch', gulp.parallel([core.watch, ui.watchAll()]))
gulp.task('watch:core', core.watch)
gulp.task('watch:studio', gulp.series([ui.cleanStudioAssets, ui.createStudioSymlink, ui.watchStudio]))
gulp.task('watch:admin', ui.watchAdmin)

gulp.task('clean:node', cb => rimraf('**/node_modules/**', cb))
gulp.task('clean:out', cb => rimraf('out', cb))
gulp.task('clean:db', cb => rimraf('out/bp/data/storage/core.sqlite', cb))

// Example: yarn cmd dev:module --public nlu or yarn cmd dev:module --private bank
gulp.task('dev:module', gulp.series([modules.cleanModuleAssets, modules.createModuleSymlink]))

gulp.task('changelog', () => {
  // see options here: https://github.com/conventional-changelog/conventional-changelog/tree/master/packages
  const changelogOts = {
    preset: 'angular',
    releaseCount: 1
  }
  const context = {}
  const gitRawCommitsOpts = {
    merges: null
  }
  const commitsParserOpts = {
    mergePattern: /^Merge pull request #(\d+) from (.*)/gi,
    mergeCorrespondence: ['id', 'source']
  }
  const changelogWriterOpts = {}

  return gulp
    .src('CHANGELOG.md')
    .pipe(changelog(changelogOts, context, gitRawCommitsOpts, commitsParserOpts, changelogWriterOpts))
    .pipe(gulp.dest('./'))
})
