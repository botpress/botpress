import util from '../util'
import stats from '../stats'
import fs from 'fs'
import path from 'path'
import _ from 'lodash'
import Promise from 'bluebird'

module.exports = function(fromVersion) {
  stats({}).track('cli', 'migration', fromVersion)

  if (!fs.existsSync('./botfile.js')) {
    throw new Error('You must be inside a bot directory to run a migration')
  }

  let files = _.sortBy(fs.readdirSync(path.join(__dirname, 'migrations')), x => x)

  const toApply = _.filter(files, f => {
    if (!/.js$/i.test(f)) {
      return false
    }

    return parseFloat(fromVersion) < parseFloat(f.replace(/\.js/i, ''))
  })

  return Promise.mapSeries(toApply, file => {
    const migration = require(path.join(__dirname, 'migrations', file))
    return migration(path.resolve('.'))
    .then(() => {
      util.print('success', `Migration ${file.replace('.js', '')} applied successfully`)
    })
  })
  .finally(() => {
    util.print('success', 'Migration completed.')
    process.exit(0)
  })
}
