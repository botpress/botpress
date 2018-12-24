const path = require('path')
const gulp = require('gulp')
const ts = require('gulp-typescript')
const sourcemaps = require('gulp-sourcemaps')
const gulpif = require('gulp-if')
const run = require('gulp-run')
const file = require('gulp-file')
const buildJsonSchemas = require('./jsonschemas')
const fs = require('fs')

const maybeFetchPro = () => {
  const isProBuild = process.env.EDITION === 'pro' || fs.existsSync('pro')
  return gulp.src('./').pipe(gulpif(isProBuild, run('git submodule update --init', { verbosity: 2 })))
}

const writeMetadata = () => {
  const metadata = JSON.stringify(
    {
      version: require(path.join(__dirname, '../package.json')).version
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
  return gulp.watch('./src/**/*.ts', compileTypescript)
}

const createOutputDirs = () => {
  return gulp
    .src('*.*', { read: false })
    .pipe(gulp.dest('./out/bp/data'))
    .pipe(gulp.dest('./out/bp/data/storage'))
}

const buildSchemas = cb => {
  buildJsonSchemas()
  cb()
}

const copyBinaries = () => {
  return gulp.src('src/bp/ml/bin/*.*').pipe(gulp.dest('./out/bp/ml/bin'))
}

const build = () => {
  return gulp.series([maybeFetchPro, writeMetadata, compileTypescript, buildSchemas, createOutputDirs, copyBinaries])
}

module.exports = {
  build,
  watch
}
