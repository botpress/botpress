/* eslint-env babel-eslint, node, mocha */

const { itBoth, run } = require('./database_base')
const notifications = require('../src/notifications')
const notificationsTable = require('../src/database/notifications')

const expect = require('chai').expect
const _ = require('lodash')

run('notifications', () => {
  let knexInstance = null

  const getNotif = () =>
    notifications({
      knex: knexInstance,
      modules: []
    })

  const createData = async knex => {
    knexInstance = knex
    await notificationsTable(knex)
  }

  afterEach(async () => {
    await knexInstance('notifications').del()
  })

  describe('getInbox', () => {
    itBoth('Returns empty array if none', async knex => {
      await createData(knex)
      const notif = getNotif()

      expect(await notif.getInbox()).to.be.empty
    })

    itBoth('Returns fresh notifications', async knex => {
      await createData(knex)
      const notif = getNotif()

      await notif.create({ message: 'Hello' })
      await notif.create({ message: 'Hello2' })

      expect(await notif.getInbox()).to.length(2)
    })

    itBoth('Object values', async knex => {
      await createData(knex)
      const notif = getNotif()

      await notif.create({ message: 'Hello' })
      const notifs = await notif.getInbox()
      expect(notifs).to.length(1)

      expect(notifs[0].id).to.be.a('string')
      expect(notifs[0].level).to.equal('info')
      expect(notifs[0].moduleId).to.equal('botpress')
      expect(notifs[0].url).to.equal('/')
      expect(notifs[0].read).to.equal(false)
    })

    itBoth("Doesn't show archived", async knex => {
      await createData(knex)
      const notif = getNotif()

      await notif.create({ message: 'Hello' })

      let notifs = await notif.getInbox()
      expect(notifs).to.length(1)
      await notif.archive(notifs[0].id)

      notifs = await notif.getInbox()
      expect(notifs).to.length(0)
    })
  })

  describe('markAsRead', () => {
    itBoth('works', async knex => {
      await createData(knex)
      const notif = getNotif()

      await notif.create({ message: 'Hello' })

      let notifs = await notif.getInbox()
      expect(notifs).to.length(1)
      await notif.markAsRead(notifs[0].id)

      notifs = await notif.getInbox()
      expect(notifs).to.length(1)
      expect(notifs[0].read).to.equal(true)
    })
  })

  describe('markAllAsRead', () => {
    itBoth('works', async knex => {
      await createData(knex)
      const notif = getNotif()

      await notif.create({ message: 'Hello' })
      await notif.create({ message: 'Hello' })

      let notifs = await notif.getInbox()
      expect(notifs).to.length(2)
      await notif.markAllAsRead()

      notifs = await notif.getInbox()
      expect(notifs).to.length(2)
      expect(notifs[0].read).to.equal(true)
      expect(notifs[1].read).to.equal(true)
    })
  })
})
