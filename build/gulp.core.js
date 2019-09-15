const path = require('path')
const gulp = require('gulp')
const ts = require('gulp-typescript')
const sourcemaps = require('gulp-sourcemaps')
const gulpif = require('gulp-if')
const run = require('gulp-run')
const file = require('gulp-file')
const buildJsonSchemas = require('./jsonschemas')
const fs = require('fs')
const mkdirp = require('mkdirp')

const maybeFetchPro = () => {
  const isProBuild = process.env.EDITION === 'pro' || fs.existsSync('pro')
  return gulp.src('./').pipe(gulpif(isProBuild, run('git submodule update --init', { verbosity: 2 })))
}

const writeMetadata = () => {
  const version = require(path.join(__dirname, '../package.json')).version
  const metadata = JSON.stringify(
    {
      version,
      build_version: `${version}__${Date.now()}`
    },
    null,
    2
  )

  return file('metadata.json', metadata, { src: true }).pipe(gulp.dest('./'))
}

const tsProject = ts.createProject(path.resolve(__dirname, '../src/tsconfig.json'))
const compileTypescript = () => {
  return tsProject
    .src()
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .pipe(
      sourcemaps.write({
        sourceRoot: file => {
          const sourceFile = path.join(file.cwd, 'src', file.sourceMap.file)
          return path.relative(path.dirname(sourceFile), file.cwd)
        }
      })
    )
    .pipe(gulp.dest('./out/bp'))
}

const watch = () => {
  return gulp.watch(['./src/**/*.ts', '!./src/bp/ui-*/**/*.ts'], compileTypescript)
}

const createOutputDirs = () => {
  return gulp
    .src('*.*', { read: false })
    .pipe(gulp.dest('./out/bp/data'))
    .pipe(gulp.dest('./out/bp/data/storage'))
}

const createMigration = cb => {
  const args = require('yargs')(process.argv).argv
  if (!args.ver) {
    console.error('Version is required (set with --ver parameter')
    console.error('Example: yarn cmd migration:create --target core --ver 13.0.0 --title "some config update"')
    return cb()
  }

  const target = args.target || 'core'
  const version = args.ver.replace(/[ .]/g, '_').replace('v', '')
  const title = (args.title || '').replace(/[ .]/g, '_').toLowerCase()

  const template =
    target === 'core'
      ? path.resolve(__dirname, '../src/bp/core/services/migration/template_core.ts')
      : path.resolve(__dirname, '../src/bp/core/services/migration/template_module.ts')

  const targetDir =
    target === 'core'
      ? path.resolve(__dirname, '../src/bp/migrations')
      : path.resolve(__dirname, `../modules/${target}/src/migrations`)

  const destination = path.resolve(targetDir, `v${version}-${Math.round(Date.now() / 1000)}-${title}.ts`)
  mkdirp.sync(targetDir)
  fs.copyFileSync(template, destination)

  console.log('Migration file created at ' + destination)
  cb()
}

const buildSchemas = cb => {
  buildJsonSchemas()
  cb()
}

const copyBinaries = () => {
  return gulp.src('src/bp/ml/bin/*.*').pipe(gulp.dest('./out/bp/ml/bin'))
}

const copyJs = () => {
  return gulp.src('src/bp/ml/svm-js/**/*.*').pipe(gulp.dest('./out/bp/ml/svm-js'))
}

const build = () => {
  return gulp.series([
    maybeFetchPro,
    writeMetadata,
    compileTypescript,
    buildSchemas,
    createOutputDirs,
    copyJs,
    copyBinaries
  ])
}

module.exports = {
  build,
  watch,
  createMigration
}
