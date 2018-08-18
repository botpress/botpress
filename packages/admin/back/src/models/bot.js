import Sequelize from 'sequelize'

module.exports = sql => {
  const Bot = sql.define('bot', {
    name: Sequelize.STRING,
    description: Sequelize.TEXT,
    publicId: { type: Sequelize.STRING, allowNull: false, unique: true, validate: { len: [8, 20] } },
    pairingToken: { type: Sequelize.STRING, allowNull: false, unique: true, validate: { len: [20, 50] } },
    paired: Sequelize.BOOLEAN,
    pairedAt: Sequelize.DATE
  })

  Bot.associate = models => {
    models.bot.belongsTo(models.team)
    models.bot.hasMany(models.botenv)
  }

  return Bot
}
