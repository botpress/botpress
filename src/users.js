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
        })
        .then()
    } else {
      await knex('users_tags')
        .insert({
          userId,
          tag,
          value,
          tagged_on: helpers(knex).date.now()
        })
        .then()
    }

    return true
  }

  async function untag(userId, tag) {
    const knex = await db.get()

    return knex('users_tags')
      .where({ userId, tag: _.toUpper(tag) })
      .del()
      .then()
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
        return _.map(tags, v => {
          return { tag: v.tag, value: v.value }
        })
      })
  }

  // TODO: Fix this, list of tags is always empty
  async function list(limit = 50, from = 0) {
    const knex = await db.get()

    const isLite = helpers(knex).isLite()

    const selectTags = isLite ? 'group_concat(tag) as tags' : "string_agg(tag, ',') as tags"

    const subQuery = knex('users_tags')
      .select('userId', knex.raw(selectTags))
      .groupBy('userId')

    return knex('users')
      .leftJoin(knex.raw('(' + subQuery.toString() + ') AS t2'), 'users.id', '=', 't2.userId')
      .select(
        'users.userId',
        'users.platform',
        'users.gender',
        'users.timezone',
        'users.locale',
        'users.picture_url',
        'users.first_name',
        'users.last_name',
        'users.created_on',
        't2.tags'
      )
      .orderBy('users.created_on', 'asc')
      .offset(from)
      .limit(limit)
      .then(users =>
        users.map(x =>
          Object.assign(x, {
            tags: (x.tags && x.tags.split(',')) || []
          })
        )
      )
  }

  // TODO: Fix this, just doesn't work
  async function listWithTags(tags, limit = 50, from = 0) {
    const knex = await db.get()

    tags = _.filter(tags, t => _.isString(t)).map(t => t.toUpperCase())
    const filterByTag = tag =>
      knex('users_tags')
        .select('userId')
        .where('tag', tag)

    const isLite = helpers(knex).isLite()
    const selectTags = isLite ? 'group_concat(tag) as tags' : "string_agg(tag, ',') as tags"

    let query = knex('users')
    let i = 0

    const subQuery = knex('users_tags')
      .select('userId', knex.raw(selectTags))
      .groupBy('userId')

    tags.forEach(tag => {
      const name = 't' + ++i
      query = query.join(
        knex.raw('(' + filterByTag(tag).toString() + ') AS ' + name),
        'users.id',
        '=',
        name + '.userId'
      )
    })

    return query
      .leftJoin(knex.raw('(' + subQuery.toString() + ') AS tt'), 'users.id', '=', 'tt.userId')
      .select(
        'users.userId as userId',
        'users.platform as platform',
        'users.gender as gender',
        'users.timezone as timezone',
        'users.locale as locale',
        'users.picture_url as picture_url',
        'users.first_name as first_name',
        'users.last_name as last_name',
        'users.created_on as created_on',
        'tt.tags as tags'
      )
      .orderBy('users.created_on', 'asc')
      .offset(from)
      .limit(limit)
      .then(users =>
        users.map(x =>
          Object.assign(x, {
            tags: (x.tags && x.tags.split(',')) || []
          })
        )
      )
  }

  async function count() {
    const knex = await db.get()

    return knex('users')
      .count('* as count')
      .then()
      .get(0)
      .then(ret => parseInt(ret && ret.count))
  }

  return { tag, untag, hasTag, getTag, getTags, list, count, listWithTags }
}
