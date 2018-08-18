import Sequelize from 'sequelize'

module.exports = sql => {
  const TeamMember = sql.define('member', {
    role: Sequelize.STRING
  })

  return TeamMember
}
