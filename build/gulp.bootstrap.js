const path = require('path')
const gulp = require('gulp')
const ts = require('gulp-typescript')
const rimraf = require('rimraf')
const run = require('gulp-run')

const bootstrapModules = cb => {
  // TODO Bootstrap script
  // Cleanup all (build|src|modules)/**/node_modules folders
  // Install && Build /build/module-builder
  // Yarn link /build/module-builder
  // Yarn install in all modules
  // Yarn link /build/module-builder in all modules
  // Done
  cb()
}

module.exports = {
  bootstrap
}
