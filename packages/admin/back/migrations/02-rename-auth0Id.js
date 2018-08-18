export default {
  up: async sql => {
    await sql.getQueryInterface().renameColumn('users', 'auth0Id', 'remoteId')
  },

  down: async sql => {
    await sql.getQueryInterface().renameColumn('users', 'remoteId', 'auth0Id')
  }
}
