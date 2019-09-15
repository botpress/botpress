const typedoc = require('gulp-typedoc')
const gulp = require('gulp')
const path = require('path')
const exec = require('child_process').exec
const showdown = require('showdown')
const cheerio = require('cheerio')
const fs = require('fs')

const buildRef = () => {
  return gulp.src(['./src/bp/sdk/botpress.d.ts']).pipe(
    typedoc({
      out: './docs/reference/public',
      mode: 'file',
      name: 'Botpress SDK',
      readme: './docs/reference/README.md',
      gaID: 'UA-90034220-1',
      includeDeclarations: true,
      ignoreCompilerErrors: true,
      version: true,
      excludeExternals: true,
      excludePattern: '**/node_modules/**',
      tsconfig: path.resolve(__dirname, '../src/tsconfig.json')
    })
  )
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

  const fixedContentPaths = $.html().replace('../assets/', 'assets/')
  fs.writeFileSync(path.join(__dirname, '../docs/reference/public/index.html'), fixedContentPaths)
}

const buildReference = () => {
  return gulp.series([buildRef, alterReference])
}

const buildGuide = cb => {
  const src = 'docs/guide/website'
  exec('yarn && yarn build', { cwd: src }, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr)
      return cb(err)
    }
    cb()
  })
}

const startDevServer = cb => {
  const src = 'docs/guide/website'
  exec('yarn && yarn start', { cwd: src }, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr)
      return cb(err)
    }
    cb()
  })
}

module.exports = {
  buildReference,
  buildGuide,
  startDevServer
}
