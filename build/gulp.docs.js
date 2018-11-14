const typedoc = require('gulp-typedoc')
const gulp = require('gulp')
const path = require('path')
const exec = require('child_process').exec

const buildReference = () => {
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
