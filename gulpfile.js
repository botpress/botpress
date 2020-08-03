const core = require('./build/gulp.core')
const modules = require('./build/gulp.modules')
const package = require('./build/gulp.package')
const gulp = require('gulp')
const ui = require('./build/gulp.ui')
const docs = require('./build/gulp.docs')
const rimraf = require('rimraf')
const changelog = require('gulp-conventional-changelog')
const yn = require('yn')
const { spawnSync } = require('child_process')
const { argv } = require('yargs')
const _ = require('lodash')

process.on('uncaughtException', err => {
  console.error('An error occurred in your gulpfile: ', err)
  process.exit(1)
})

if (yn(process.env.GULP_PARALLEL)) {
  gulp.task(
    'build',
    gulp.series([ui.buildSharedLite(), core.build(), ui.buildShared(), ui.initStudio, gulp.parallel(modules.build(), ui.build())])
  )
} else {
  gulp.task('build', gulp.series([ui.buildSharedLite(), core.build(), ui.buildShared(), ui.initStudio, modules.build(), ui.build()]))
}

gulp.task('default', cb => {
  console.log(`
    Development Cheat Sheet
    ==================================
    yarn cmd dev:modules                Creates a symlink to modules bundles (restart server to apply backend changes - refresh for UI)
                                        After this command, type "yarn watch" in each module folder you want to watch for changes
    yarn cmd watch:core                 Recompiles the server on file modification (restart server to apply)
    yarn cmd watch:studio               Recompiles the bundle on file modification (no restart required - refresh page manually)
    yarn cmd watch:admin                Recompiles the bundle on file modification (no restart required - page refresh automatically)
    yarn cmd watch:shared               Recompiles the bundle on file modification (no restart required - refresh page manually)
    yarn cmd build:modules --m m1,m2,m3 Builds modules m1, m2 and m3 only
                                        Here m1 is the module name like nlu
                                        Modules are separated with a comma (,) and no spaces
    yarn cmd build:modules --a m1       Builds all modules that matches *m1*
    yarn cmd lint --baseBranch=dev      Runs the linter on file difference between base and current branch
    yarn cmd lint --staged              Runs the linter on staged files
    yarn cmd lint --fix                 Runs the linter and try to fix rules which are fixable, then stages fixes
  `)
  cb()
})

gulp.task('build:ui', ui.build())
gulp.task('build:core', core.build())
gulp.task('build:sharedLite', ui.buildSharedLite())
gulp.task('build:shared', ui.buildShared())
gulp.task('init:studio', ui.initStudio)
gulp.task('build:modules', gulp.series([modules.build()]))

gulp.task('start:guide', docs.startDevServer)
gulp.task('build:guide', docs.buildGuide())
gulp.task('build:reference', docs.buildReference())

gulp.task('package:core', package.packageCore())
gulp.task('package', gulp.series([package.packageApp, modules.packageModules(), package.copyNativeExtensions]))

gulp.task('watch', gulp.parallel([core.watch, ui.watchAll]))
gulp.task('watch:core', core.watch)
gulp.task('watch:studio', ui.watchStudio)
gulp.task('watch:admin', ui.watchAdmin)
gulp.task('watch:ui', ui.watchAll)
gulp.task('watch:shared', ui.watchShared)
gulp.task('watch:modules', modules.watchModules)

gulp.task('clean:node', cb => rimraf('**/node_modules/**', cb))
gulp.task('clean:out', cb => rimraf('out', cb))
gulp.task('clean:data', cb => rimraf('out/bp/data', cb))
gulp.task('clean:db', cb => rimraf('out/bp/data/storage/core.sqlite', cb))

gulp.task('dev:modules', modules.createAllModulesSymlink())

/**
 * Example: yarn cmd migration:create --target core --ver 13.0.0 --title "some config update"
 * target can either be "core" or the name of any module
 */
gulp.task('migration:create', core.createMigration)

gulp.task('check-translations', core.checkTranslations)

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

gulp.task('lint', cb => {
  if (argv.staged) {
    const command = `yarn run lint-staged --no-stash -c config/lint-staged${argv.fix ? '.fix' : ''}.config.js`
    spawnSync(command, { shell: true, stdio: 'inherit' }, err => cb(err))
    cb()
    return
  }

  const baseBranch = argv.baseBranch || 'dev'
  const gitResult = spawnSync('git', ['--no-pager', 'diff', `${baseBranch}..`, '--name-only'], { stdio: 'pipe' })

  const files = String(gitResult.output)
    .split('\n')
    .filter(file => /\.tsx?$/.test(file))

  for (const batch of _.chunk(files, 100)) {
    const command = `yarn run tslint -c tslint.newrules.json ${argv.fix ? '--fix' : ''}`
    spawnSync(command, [batch.join(' ')], { shell: true, stdio: 'inherit' }, err => cb(err))
  }

  cb()
})
