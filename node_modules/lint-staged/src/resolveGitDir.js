'use strict'

const path = require('path')

module.exports = function resolveGitDir(gitDir) {
  return gitDir ? path.resolve(gitDir) : process.cwd()
}
