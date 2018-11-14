const path = require('path')
const fs = require('fs')
const gulp = require('gulp')
const ts = require('gulp-typescript')
const sourcemaps = require('gulp-sourcemaps')
const gulpif = require('gulp-if')
const run = require('gulp-run')
const file = require('gulp-file')
const buildJsonSchemas = require('./jsonschemas')
const showdown = require('showdown')
const cheerio = require('cheerio')

const maybeFetchPro = () => {
  const runningPro = process.env.EDITION === 'pro' || process.env.EDITION === 'ee'
  return gulp.src('./').pipe(gulpif(runningPro, run('git submodule update --init', { verbosity: 2 })))
}

const writeMetadata = () => {
  const metadata = JSON.stringify(
    {
      edition: process.env.EDITION || 'ce',
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

const copyGlobalTemplate = () => {
  return gulp.src('./src/templates/data/**/*').pipe(gulp.dest('./out/bp/data', { overwrite: false }))
}

const copyBotTemplate = () => {
  return gulp.src('./src/templates/bot-template/**/*').pipe(gulp.dest('./out/bp/templates/bot-template'))
}

const buildSchemas = cb => {
  buildJsonSchemas()
  cb()
}

const alterReference = async () => {
  const converter = new showdown.Converter()
  const markdown = fs.readFileSync(path.join(__dirname, '../docs/reference/README.md'), 'utf8')
  const html = converter.makeHtml(markdown)

  const original = fs.readFileSync(path.join(__dirname, '../docs/reference/public/modules/_botpress_sdk_.html'), 'utf8')
  const $ = cheerio.load(original)

  $('.container-main .col-content > .tsd-comment')
    .removeClass('tsd-comment')
    .addClass('tsd-typography')
    .html(html)

  const newFile = $.html()

  fs.writeFileSync(path.join(__dirname, '../docs/reference/public/modules/_botpress_sdk_.html'), newFile)

  $('a').map(function() {
    const href = $(this).attr('href')
    if (href && href.startsWith('_botpress_sdk')) {
      $(this).attr('href', 'modules/' + href)
    }
  })

  fs.writeFileSync(path.join(__dirname, '../docs/reference/public/index.html'), $.html())
}

const build = () => {
  return gulp.series([
    maybeFetchPro,
    writeMetadata,
    compileTypescript,
    buildSchemas,
    createOutputDirs,
    copyGlobalTemplate,
    copyBotTemplate
  ])
}

module.exports = {
  build,
  watch
}
