import Sequelize from 'sequelize'

module.exports = sql => {
  const User = sql.define(
    'user',
    {
      username: { type: Sequelize.STRING, unique: true, allowNull: false, validate: { len: [3, 30] } },
      firstname: Sequelize.STRING,
      lastname: Sequelize.STRING,
      picture: Sequelize.STRING,
      company: Sequelize.STRING,
      lastIp: Sequelize.STRING,
      email: { type: Sequelize.STRING, validate: { isEmail: true } },
      remoteId: { type: Sequelize.STRING, unique: true, allowNull: false },
      location: Sequelize.STRING,
      provider: Sequelize.STRING,
      lastSyncedAt: Sequelize.DATE
    },
    {
      getterMethods: {
        fullName() {
          return this.firstname + ' ' + this.lastname
        }
      },

      setterMethods: {
        fullName(value) {
          const names = value.split(' ')

          this.setDataValue('firstname', names.slice(0, -1).join(' '))
          this.setDataValue('lastname', names.slice(-1).join(' '))
        }
      }
    }
  )

  User.associate = models => {
    models.user.belongsToMany(models.team, { as: 'Teams', through: models.member })
  }

  return User
}
