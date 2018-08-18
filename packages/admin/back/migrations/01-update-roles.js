const defaultRoles = require('../config/default-roles.json')

export default {
  up: async sql => {
    await sql.query('TRUNCATE roles')

    const teams = await sql.query('SELECT id from teams', { type: sql.QueryTypes.SELECT })

    let newRoles = []
    for (const t of teams) {
      const teamId = t.id
      newRoles = newRoles.concat(
        defaultRoles.map(role => ({
          ...role,
          rules: JSON.stringify(role.rules),
          teamId,
          createdAt: 'now()',
          updatedAt: 'now()'
        }))
      )
    }

    await sql.getQueryInterface().bulkInsert('roles', newRoles)
  }
}
