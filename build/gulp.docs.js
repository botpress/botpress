const typedoc = require('gulp-typedoc')
const gulp = require('gulp')
const path = require('path')
const showdown = require('showdown')
const cheerio = require('cheerio')
const fs = require('fs')

const buildRef = () => {
  return gulp.src(['./packages/bp/src/sdk/botpress.d.ts']).pipe(
    typedoc({
      out: './docs/reference/public',
      mode: 'file',
      name: 'Botpress SDK',
      readme: './docs/reference/README.md',
      theme: './build/docs/typeDocTheme',
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

  $('head > title')
    .replaceWith('<title>Chatbot Framework SDK | Botpress SDK</title>')
    .html(html)

  $('head').append(
    '<meta name="description" content="Botpress Chatbot software development kit has all the tools you need to create your own custom chatbot.">'
  )

  $('meta[name="robots"]').remove()

  const newFile = $.html()

  fs.writeFileSync(path.join(__dirname, '../docs/reference/public/modules/_botpress_sdk_.html'), newFile)

  const hrefsToReplace = ['../enums', '../classes', '../interfaces']
  $('a').map(function() {
    const href = $(this).attr('href')
    if (!href) {
      return
    }

    if (href.startsWith('_botpress_sdk')) {
      $(this).attr('href', 'modules/' + href)
    }

    if (hrefsToReplace.find(x => href.startsWith(x))) {
      $(this).attr('href', href.replace('../', ''))
    }
  })

  const fixedContentPaths = $.html()
    .replace(/\.\.\/assets/g, 'assets')
    .replace(/\.\.\/globals.html/g, 'globals.html')
  fs.writeFileSync(path.join(__dirname, '../docs/reference/public/index.html'), fixedContentPaths)
}

const buildReference = () => {
  return gulp.series([buildRef, alterReference])
}

module.exports = {
  buildReference
}
