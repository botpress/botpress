import Sequelize from 'sequelize'

module.exports = sql => {
  const Team = sql.define('team', {
    name: Sequelize.STRING,
    inviteCode: Sequelize.STRING
  })

  Team.associate = models => {
    models.team.belongsToMany(models.user, { as: 'Members', through: models.member, onDelete: 'cascade' })
    models.team.hasMany(models.role, { as: 'roles', onDelete: 'cascade' })
  }

  return Team
}
