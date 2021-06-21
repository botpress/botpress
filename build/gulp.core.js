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
const { exec, spawn } = require('child_process')
const rimraf = require('gulp-rimraf')

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

const clearMigrations = () => {
  return gulp.src('./out/bp/migrations/*.*', { allowEmpty: true }).pipe(rimraf())
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
  return gulp.watch(['./src/**/*.ts'], { ignored: ['./src/bp/ui-**'] }, compileTypescript)
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

const copyPreTrained = () => {
  return gulp.src('src/bp/nlu/engine/assets/pre-trained/*').pipe(gulp.dest('./out/bp/nlu/engine/assets/pre-trained'))
}

const copyStopWords = () => {
  return gulp.src('src/bp/nlu/engine/assets/stop-words/*').pipe(gulp.dest('./out/bp/nlu/engine/assets/stop-words'))
}

const checkTranslations = cb => {
  const reorder = process.argv.find(x => x.toLowerCase() === '--reorder')
  exec(`node build/check-translations.js ${reorder && '--reorder'}`, (err, stdout, stderr) => {
    console.log(stdout, stderr)
    cb(err)
  })
}

const buildDownloader = cb => {
  const child = exec('yarn && yarn build', { cwd: 'build/downloader' }, err => cb(err))
  child.stdout.pipe(process.stdout)
  child.stderr.pipe(process.stderr)
}

const initDownloader = cb => {
  const proc = spawn('yarn', ['start', 'init'], { cwd: 'build/downloader', stdio: 'inherit', shell: true })
  proc.on('exit', (code, signal) =>
    cb(code !== 0 ? new Error(`Process exited with exit-code ${code} and signal ${signal}`) : undefined)
  )
}

const build = () => {
  return gulp.series([
    clearMigrations,
    maybeFetchPro,
    writeMetadata,
    compileTypescript,
    buildSchemas,
    createOutputDirs,
    copyBinaries,
    copyPreTrained,
    copyStopWords
  ])
}

module.exports = {
  build,
  watch,
  checkTranslations,
  buildDownloader,
  initDownloader
}
