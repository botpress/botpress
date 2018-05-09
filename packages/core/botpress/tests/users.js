/* eslint-env babel-eslint, node, mocha */

const { itBoth, run } = require('./database_base')
const users = require('../src/users')
const usersTable = require('../src/database/users')
const tagsTable = require('../src/database/tags')
const expect = require('chai').expect
const Promise = require('bluebird')
const _ = require('lodash')
const moment = require('moment')

run('users', () => {
  let knexInstance = null

  const getUsers = () =>
    users({
      db: {
        get: () => knexInstance
      }
    })

  const createUsers = async knex => {
    knexInstance = knex
    await usersTable(knex)
    await tagsTable(knex)
    for (let i = 0; i <= 10; i++) {
      const id = 'dummy-' + i
      const userRow = {
        id: 'tests:' + id,
        userId: id,
        platform: 'tests',
        gender: 'unknown',
        created_on: moment(new Date()).toISOString()
      }

      await Promise.delay(1)
      await knex('users')
        .insert(userRow)
        .then()
    }
  }

  afterEach(async () => {
    await knexInstance('users')
      .where('id', 'like', 'tests:%')
      .del()
    await knexInstance('users_tags')
      .where('userId', 'like', 'tests:%')
      .del()
  })

  describe('tags', () => {
    itBoth('Tagging works', async knex => {
      await createUsers(knex)
      await getUsers().tag('tests:dummy-1', 'hello')
      await getUsers().tag('tests:dummy-2', 'hello', 'world')
      await getUsers().tag('tests:dummy-3', 'HELLO')

      expect(await getUsers().hasTag('tests:dummy-1', 'HeLlO')).to.equal(true)
      expect(await getUsers().hasTag('tests:dummy-2', 'HELLO')).to.equal(true)
      expect(await getUsers().hasTag('tests:dummy-3', 'hello')).to.equal(true)
      expect(await getUsers().getTag('tests:dummy-2', 'HELLO')).to.equal('world')
    })

    itBoth('Detailed tagging works', async knex => {
      await createUsers(knex)
      await getUsers().tag('tests:dummy-2', 'hello', 'world')

      const tag = await getUsers().getTag('tests:dummy-2', 'HELLO', true)
      expect(tag).to.have.property('tag', 'HELLO')
      expect(tag).to.have.property('value', 'world')
      expect(tag)
        .to.have.property('tagged_on')
        .to.be.an.instanceof(Date)
        .to.be.below(
          moment()
            .add(1, 'second')
            .toDate()
        )
        .to.be.above(
          moment()
            .subtract(5, 'second')
            .toDate()
        )
    })

    itBoth('Updating tag works', async knex => {
      await createUsers(knex)
      await getUsers().tag('tests:dummy-1', 'hello', 'world1')
      expect(await getUsers().getTag('tests:dummy-1', 'HELLO')).to.equal('world1')
      await getUsers().tag('tests:dummy-1', 'hello', 'world2')
      expect(await getUsers().getTag('tests:dummy-1', 'HELLO')).to.equal('world2')
    })

    itBoth('Untagging works', async knex => {
      await createUsers(knex)

      await getUsers().tag('tests:dummy-1', 'hello')
      expect(await getUsers().hasTag('tests:dummy-1', 'HELLO')).to.equal(true)

      await getUsers().untag('tests:dummy-1', 'hello')
      expect(await getUsers().hasTag('tests:dummy-1', 'HELLO')).to.equal(false)
    })

    itBoth('Getting a user`s list of tags works', async knex => {
      await createUsers(knex)

      await getUsers().tag('tests:dummy-1', 'hello1')
      await getUsers().tag('tests:dummy-1', 'hello2')
      await getUsers().tag('tests:dummy-1', 'hello3')

      await getUsers().tag('tests:dummy-1', 'hello4')
      await getUsers().untag('tests:dummy-1', 'hello4')

      const tags = await getUsers().getTags('tests:dummy-1')

      expect(tags).to.length(3)
      expect(tags).to.satisfy(
        arr => _.find(arr, { tag: 'HELLO1' }) && _.find(arr, { tag: 'HELLO2' }) && _.find(arr, { tag: 'HELLO3' })
      )
    })
  })

  describe('count', () => {
    itBoth('Works', async knex => {
      await createUsers(knex)
      expect(await getUsers().count()).to.equal(11)
    })
  })

  describe('list', () => {
    itBoth('Returns users', async knex => {
      await createUsers(knex)
      await getUsers().tag('tests:dummy-1', 'hello1')
      await getUsers().tag('tests:dummy-1', 'hello2')
      await getUsers().tag('tests:dummy-1', 'hello3')

      const list = await getUsers().list()

      expect(list).to.satisfy(arr => {
        const dummy1 = _.find(arr, { userId: 'dummy-1' })
        return dummy1 && _.includes(dummy1.tags, 'HELLO1') && _.includes(dummy1.tags, 'HELLO3')
      })

      expect(list).to.length(11)
      expect(list[0].tags).to.length(0)
      expect(list[1].tags).to.length(3)
    })

    itBoth('Paging works', async knex => {
      await createUsers(knex)

      const list = await getUsers().list(2, 1)

      expect(list[0].userId).to.equal('dummy-1')
      expect(list[1].userId).to.equal('dummy-2')
    })
  })

  describe('list with tags', () => {
    itBoth('Returns users', async knex => {
      await createUsers(knex)
      await getUsers().tag('tests:dummy-1', 'hello')
      await getUsers().tag('tests:dummy-1', 'world')
      await getUsers().tag('tests:dummy-5', 'hello')
      await getUsers().tag('tests:dummy-5', 'world')
      await getUsers().tag('tests:dummy-9', 'hello')

      const list = await getUsers().listWithTags(['hello', 'world'])

      expect(list).to.length(2)
      expect(list[0].userId).to.equal('dummy-1')
      expect(list[1].userId).to.equal('dummy-5')
      expect(list[0].tags).to.length(2)
      expect(list[1].tags).to.length(2)
    })
  })
})
