import Sequelize from 'sequelize'

module.exports = sql => {
  const TeamRole = sql.define('role', {
    name: { type: Sequelize.STRING, allowNull: false },
    description: Sequelize.TEXT,
    rules: { type: Sequelize.JSONB, allowNull: false }
  })

  return TeamRole
}
