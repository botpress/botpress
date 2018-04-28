'use strict'

const path = require('path')
const minimatch = require('minimatch')
const getConfig = require('./getConfig').getConfig
const resolveGitDir = require('./resolveGitDir')

module.exports = function generateTasks(config, files) {
  const normalizedConfig = getConfig(config) // Ensure we have a normalized config
  const linters = normalizedConfig.linters
  const gitDir = normalizedConfig.gitDir
  const globOptions = normalizedConfig.globOptions
  return Object.keys(linters).map(pattern => {
    const commands = linters[pattern]
    const filter = minimatch.filter(pattern, globOptions)
    const fileList = files
      // We want to filter before resolving paths
      .filter(filter)
      // Return absolute path after the filter is run
      .map(file => path.resolve(resolveGitDir(gitDir), file))
    return {
      pattern,
      commands,
      fileList
    }
  })
}
