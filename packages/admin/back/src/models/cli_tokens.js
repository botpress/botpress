import Sequelize from 'sequelize'

module.exports = sql => {
  const CliToken = sql.define('cli_token', {
    cliToken: { type: Sequelize.STRING, allowNull: false },
    validUntil: Sequelize.DATE
  })

  CliToken.associate = models => {
    models.cli_token.belongsTo(models.user)
  }

  return CliToken
}
