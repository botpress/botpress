/*
  The goal of these helpers is to generate SQL queries
  that are valid for both SQLite and Postgres
*/

import moment from 'moment'

const isLite = knex => {
  return knex.client.config.client === 'sqlite3'
}

module.exports = knex => {


  }
}