import _ from 'lodash'
import helpers from './database/helpers'

module.exports = ({ db }) => {
  
  async function tag(userId, tag, value = true) {
    const knex = await db.get()
    
    tag = _.toUpper(tag)

    if (await hasTag(userId, tag)) {
      await knex('users_tags')
      .where({ userId, tag })
      .update({
        userId,
        tag,
        value,
        tagged_on: helpers(knex).date.now()
      }).then()
    } else {
      await knex('users_tags').insert({
        userId,
        tag,
        value,
        tagged_on: helpers(knex).date.now()
      }).then()
    }
    
    return true
  }

  async function untag(userId, tag) {
    const knex = await db.get()

    return knex('users_tags')
    .where({ userId, tag: _.toUpper(tag) })
    .del().then()
  }

  async function hasTag(userId, tag) {
    const knex = await db.get()

    return knex('users_tags')
    .select('userId')
    .where({ userId, tag: _.toUpper(tag) })
    .limit(1)
    .then(ret => ret.length > 0)
  }

  async function getTag(userId, tag) {
    const knex = await db.get()

    return knex('users_tags')
    .select('value')
    .where({ userId, tag: _.toUpper(tag) })
    .limit(1)
    .then()
    .get(0)
    .then(ret => ret && ret.value)
  }

  async function getTags(userId) {
    const knex = await db.get()

    return knex('users_tags')
    .where({ userId })
    .select('tag', 'value')
    .then(tags => {
      return _.map(tags, (v) => {
        return { tag: v.tag, value: v.value }
      })
    })
  }

  async function getCreationDate(userId) {
    const knex = await db.get()

    return knex('users')
    .where({ userId })
    .select('created_on')
    .limit(1)
    .then()
    .get(0)
    .then(ret => ret && ret.created_on)
  }

  async function list(limit = 50, fromId = null) {
    const knex = await db.get()

    let fromDate = helpers(knex).date.now()
    
    if (!_.isNil(fromId)) {
      fromDate = await getCreationDate(fromId)
    }

    return knex('users')
    .select(
      'userId',
      'platform',
      'gender',
      'timezone',
      'locale',
      'picture_url',
      'first_name',
      'last_name',
      'created_on'
    )
    .orderBy('created_on', 'desc')
    .whereNot('userId', fromId)
    .where('created_on', '<', fromDate)
    .limit(limit)
    .then(users => {
      return Promise.all(_.map(users, async (user) => {
        const tags = await getTags(user.userId)
        user.id = user.userId
        user.tags = tags
        return user
      }))
    })
  }

  return { tag, untag, hasTag, getTag, getTags, list, getCreationDate }
}
