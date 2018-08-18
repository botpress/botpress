import path from 'path'
import Sequelize from 'sequelize'
import _ from 'lodash'
import Promise from 'bluebird'
import yn from 'yn'
import Umzug from 'umzug'

import * as models from './models'

const log = require('debug')('db')

const runMigratiosn = sequelize => {
  const umzug = new Umzug({
    storage: 'sequelize',
    storageOptions: {
      sequelize
    },

    migrations: {
      params: [
        sequelize,
        sequelize.constructor, // DataTypes
        function() {
          throw new Error('Migration tried to use old style "done" callback. Please return a promise instead.')
        }
      ],
      path: path.resolve(__dirname, '..', 'migrations'),
      pattern: /\.js$/
    }
  })

  return umzug.up()
}

export default callback => {
  const databaseUrl = process.env.DATABASE_URL
  const sql = new Sequelize(databaseUrl, { dialect: 'postgres' })

  sql
    .authenticate()
    .then(async () => {
      const dropExistingTables = yn(process.env.DATABASE_FORCE_SYNC)

      if (!dropExistingTables) {
        log('Running migrations...')
        await runMigratiosn(sql)
        log('Running migrations: success.')
      }

      await Promise.map(_.values(models), async model => await model(sql))

      await Promise.mapSeries(
        _.values(sql.models),
        async model => model.associate && (await model.associate(sql.models))
      )

      await sql.sync({ force: dropExistingTables })

      log('Database connection successful')
      callback(null, sql)
    })
    .catch(err => {
      callback("Can't connect to database: " + databaseUrl + '.. ' + err)
    })
}
