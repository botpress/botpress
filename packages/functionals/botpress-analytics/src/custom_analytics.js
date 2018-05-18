import moment from 'moment'
import _ from 'lodash'
import Promise from 'bluebird'

module.exports = ({ bp }) => {
  const graphs = []

  async function update(name, operation, value, racing = false) {
    if (!_.isString(name)) {
      throw new Error('Invalid name, expected a string')
    }

    const knex = await bp.db.get()

    const today = moment().format('YYYY-MM-DD')
    name = name.toLowerCase().trim()

    if (!name.includes('~')) {
      name += '~'
    }

    const result = await knex('analytics_custom')
      .where('date', today)
      .andWhere('name', name)
      .update('count', operation)
      .then()

    if (result == 0 && !racing) {
      await knex('analytics_custom')
        .insert({
          name: name,
          date: today,
          count: value
        })
        .catch(err => {
          return update(name, operation, value, true)
        })
    }
  }

  async function increment(name, count = 1) {
    if (!_.isNumber(count)) {
      throw new Error('Invalid count increment, expected a valid number')
    }

    const countQuery = count < 0 ? 'count - ' + Math.abs(count) : 'count + ' + Math.abs(count)

    const knex = await bp.db.get()

    return update(name, knex.raw(countQuery), count)
  }

  async function decrement(name, count = 1) {
    return increment(name, count * -1)
  }

  async function set(name, count = 1) {
    return update(name, count, count)
  }

  //{ name, type, description, variables }
  function addGraph(graph) {
    if (!_.includes(['count', 'countUniq', 'percent', 'piechart'], graph.type)) {
      throw new Error('Unknown graph of type ' + graph.type)
    }

    graphs.push(graph)
  }

  const getters = {
    count: async function(graph, from, to) {
      const knex = await bp.db.get()

      const variable = _.first(graph.variables)

      const rows = await knex('analytics_custom')
        .select(['date', knex.raw('sum(count) as count')])
        .where('date', '>=', from)
        .andWhere('date', '<=', to)
        .andWhere('name', 'LIKE', variable + '~%')
        .groupBy('date')
        .then(rows => {
          return rows.map(row => {
            return Object.assign(row, { count: parseInt(row.count) })
          })
        })

      return Object.assign({}, graph, { results: rows })
    },

    async countUniq(graph, from, to) {
      const knex = await bp.db.get()
      const variable = _.first(graph.variables)

      const uniqRecordsQuery = function() {
        this.select(knex.raw('distinct name'))
          .from('analytics_custom')
          .where('date', '>=', from)
          .andWhere('date', '<=', to)
          .andWhere('name', 'LIKE', variable + '~%')
          .as('t1')
      }

      const { count: countUniq } = await knex
        .count('*')
        .from(uniqRecordsQuery)
        .first()
      const results = await this.count(graph, from, to)
      return { ...graph, ...results, countUniq }
    },

    percent: async function(graph, from, to) {
      const variable1 = _.first(graph.variables)
      const variable2 = _.last(graph.variables)

      const count1 = await getters.count({ variables: [variable1] }, from, to)
      const count2 = await getters.count({ variables: [variable2] }, from, to)

      const allDates = _.uniq([..._.map(count1.results, 'date'), ..._.map(count2.results, 'date')])

      const rows = allDates.map(date => {
        const n1 = _.find(count1.results, { date: date }) || { count: 0 }
        const n2 = _.find(count2.results, { date: date }) || { count: 1 }

        let percent = n1.count / n2.count

        if (_.isFunction(graph.fn)) {
          percent = graph.fn(n1.count, n2.count)
        }

        if (percent > 1) {
          percent = 1
        }

        return { date: date, percent: percent }
      })

      return Object.assign({}, graph, { results: rows })
    },

    piechart: async function(graph, from, to) {
      const knex = await bp.db.get()

      const variable = _.first(graph.variables)

      const rows = await knex('analytics_custom')
        .select(['name', knex.raw('sum(count) as count')])
        .where('date', '>=', from)
        .andWhere('date', '<=', to)
        .andWhere('name', 'LIKE', variable + '~%')
        .groupBy('name')
        .then(rows => {
          return rows.map(row => {
            const name = _.drop(row.name.split('~')).join('~')

            return Object.assign(row, {
              name: _.isEmpty(name) ? 'unknown' : name,
              count: parseInt(row.count)
            })
          })
        })

      return Object.assign({}, graph, { results: rows })
    }
  }

  async function getAll(from, to) {
    return Promise.map(graphs, graph => getters[graph.type](graph, from, to))
  }

  return { increment, decrement, set, addGraph, getAll }
}
