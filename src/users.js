import _ from 'lodash'
import helpers from './database/helpers'

module.exports = ({ db }) => {
  
  async function tag(userId, tag, value = true) {
    const knex = await db.get()

    const method = await hasTag(userId, tag) ? 'update' : 'insert'
    
    await knex('users_tags')[method]({
      userId,
      tag: _.toUpper(tag),
      value,
      tagged_on: helpers(knex).date.now()
    }).then()
    
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

  return { tag, untag, hasTag, getTag }
}
