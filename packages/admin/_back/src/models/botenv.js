import Sequelize from 'sequelize'

module.exports = sql => {
  const BotEnvironment = sql.define('botenv', {
    name: { type: Sequelize.STRING, allowNull: false, validate: { isLowercase: true } },
    botUrl: Sequelize.STRING,
    lastStartedAt: Sequelize.DATE
  })

  BotEnvironment.associate = models => {
    models.botenv.belongsTo(models.bot)
  }

  return BotEnvironment
}
