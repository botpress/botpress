/**
 * The Users namespace contains operations available for the known users of your bot.
 * @public
 * @namespace Users
 * @example
 * bp.users
 */

import _ from 'lodash'
import helpers from './database/helpers'

module.exports = ({ db }) => {
  /**
   * Returns whether or not a user has a specific tag or not.
   * @param  {String} userId
   * @param  {String} tag    The name of the tag. Case insensitive.
   * @return {Boolean}
   * @async
   * @memberof! Users
   * @example
   * if (await bp.users.hasTag(event.user.id, 'IS_SUBSCRIBED')) {...}
   */
  const hasTag = async (userId, tag) => {
    const knex = await db.get()

    return knex('users_tags')
      .select('userId')
      .where({ userId, tag: _.toUpper(tag) })
      .limit(1)
      .then(ret => ret.length > 0)
  }

  /**
   * Tags a user with a specific tag (or overwrites an existing one) and a given value for that tag (optional).
   * Tags can be used to classify users (no value needed) or to store information about them (with a tag value).
   * Values are useful to store user information like emails, etc.
   * Value is always assumed to be a string.
   * @param  {String}  userId
   * @param  {String}  tag    The name of the tag.
   * Case insensitive. Note that this property will always be upper-cased.
   * @param  {String} [value]  Any string value to store info about this tag
   * @async
   * @memberof! Users
   * @example
   * await bp.users.tag(event.user.id, 'EMAIL', 'sylvain@botpress.io')
   * await bp.users.tag(event.user.id, 'PAYING_USER')
   */
  const tag = async (userId, tag, value = true) => {
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
  }

  /**
   * Removes a tag from a user if it exists.
   * @param  {String} userId
   * @param  {String} tag    Name of the tag. Case-insensitive.
   * @memberof! Users
   */
  const untag = async (userId, tag) => {
    const knex = await db.get()

    await knex('users_tags')
      .where({ userId, tag: _.toUpper(tag) })
      .del()
      .then()
  }

  /**
   * Returns the value of a user tag, if it exists
   * @param  {String} userId [description]
   * @param  {String} tag    [description]
   * @return {?String}        Value of the tag
   * @memberof! Users
   */
  const getTag = async (userId, tag, details = false) => {
    const knex = await db.get()

    return knex('users_tags')
      .select('value', 'tagged_on', 'tag')
      .where({ userId, tag: _.toUpper(tag) })
      .limit(1)
      .then()
      .get(0)
      .then(ret => {
        if (ret && details) {
          return {
            ...ret,
            tagged_on: new Date(ret.tagged_on)
          }
        }

        return ret && ret.value
      })
  }

  /**
   * Returns all the tags for a given user
   * @param  {String} userId [description]
   * @return {Array.<{ tag: String, value: String}>}        An array of all the tags for this user
   * @memberof! Users
   */
  const getTags = async userId => {
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
  const list = async (limit = 50, from = 0) => {
    const knex = await db.get()

    const isLite = helpers(knex).isLite()

    const selectTags = isLite ? 'group_concat(tag) as tags' : "string_agg(tag, ',') as tags"

    const subQuery = knex('users_tags')
      .select('userId', knex.raw(selectTags))
      .groupBy('userId')

    return knex('users')
      .leftJoin(knex.raw('(' + subQuery.toString() + ') AS t2'), 'users.id', '=', 't2.userId')
      .select(
        'users.id',
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
  const listWithTags = async (tags, limit = 50, from = 0) => {
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

  const count = async () => {
    const knex = await db.get()

    return knex('users')
      .count('* as count')
      .then()
      .get(0)
      .then(ret => parseInt(ret && ret.count))
  }

  return { tag, untag, hasTag, getTag, getTags, list, count, listWithTags }
}
