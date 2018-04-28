import moment from 'moment'
import Promise from 'bluebird'
import _ from 'lodash'
import { DatabaseHelpers as helpers } from 'botpress'

const oneDayMs = 1000 * 60 * 60 * 24

let knex = null

function rangeDates() {
  return knex('users')
    .select(knex.raw('max(created_on) as max, min(created_on) as min'))
    .then()
    .get(0)
    .then(result => {
      if (!result.min || !result.max) {
        return null
      }

      const range = moment(result.max).diff(moment(result.min), 'days')
      const ranges = []
      for (let i = 1; i <= 10; i++) {
        ranges.push(parseInt(result.min + range / 10 * i))
      }
      const ret = {
        min: result.min,
        max: result.max,
        format: null,
        ranges: ranges
      }
      if (range < 360) {
        ret.format = date => moment(date).format('MMM Do')
      } else {
        // > 1year period
        ret.format = date => moment(date).format('MMM YY')
      }

      return ret
    })
}

function getTotalUsers() {
  return rangeDates().then(dates => {
    if (!dates) {
      return
    }
    return knex('users')
      .select(knex.raw('distinct platform'))
      .then(platforms => {
        const statsBase = platforms.reduce(
          (acc, curr) => {
            acc[curr.platform] = 0
            return acc
          },
          { total: 0 }
        )

        return knex('users')
          .select(knex.raw('count(*) as count, max(created_on) as date, max(platform) as platform'))
          .groupBy(knex.raw('date(created_on), platform'))
          .orderBy(knex.raw('date(created_on)'))
          .then(rows => {
            let total = 0
            const totalPlatform = {}
            const result = {}
            const min = dates.format(moment(new Date(dates.min)).subtract(1, 'day'))
            result[min] = Object.assign({}, statsBase)
            rows.map(row => {
              const date = dates.format(row.date)
              if (!result[date]) {
                result[date] = Object.assign({}, statsBase)
              }
              if (!totalPlatform[row.platform]) {
                totalPlatform[row.platform] = 0
              }
              const count = parseInt(row.count)
              totalPlatform[row.platform] += count
              result[date].total = total += count
              result[date][row.platform] = totalPlatform[row.platform]
            })
            const max = dates.format(moment(new Date(dates.max)).add(1, 'hour'))
            result[max] = Object.assign({}, statsBase, { total: total }, totalPlatform)
            return _.toPairs(result).map(([k, v]) => {
              v.name = k
              return v
            })
          })
      })
  })
}

function getLastDaysRange(nb) {
  const nbOfDays = nb || 14

  const ranges = _.times(nbOfDays, Number)
  return ranges.map(n => {
    const date = moment(new Date()).subtract(n, 'days')
    return {
      date: date.format('MMM Do'),
      start: date.startOf('day').toDate(),
      end: date.endOf('day').toDate(),
      day: date.format('l')
    }
  })
}

function getDailyActiveUsers() {
  const ranges = _.reverse(getLastDaysRange())
  return Promise.mapSeries(ranges, range => {
    return knex('analytics_interactions')
      .select(knex.raw('count(*) as count, platform'))
      .join('users', 'users.id', 'analytics_interactions.user')
      .where(helpers(knex).date.isBetween('ts', range.start, range.end))
      .andWhere('direction', '=', 'in')
      .groupBy(['user', 'platform'])
      .then(results => {
        return results.reduce(
          function(acc, curr) {
            const count = parseInt(curr.count)
            acc.total += count
            acc[curr.platform] = count
            return acc
          },
          { total: 0, name: range.date }
        )
      })
  })
}

function getDailyGender() {
  const ranges = _.reverse(getLastDaysRange())
  return Promise.mapSeries(ranges, range => {
    return knex('analytics_interactions')
      .select(knex.raw('count(*) as count, gender'))
      .join('users', 'users.id', 'analytics_interactions.user')
      .where(helpers(knex).date.isBetween('ts', range.start, range.end))
      .andWhere('direction', '=', 'in')
      .groupBy(['user', 'gender'])
      .then(results => {
        return results.reduce(
          function(acc, curr) {
            const count = parseInt(curr.count)
            acc.total += count
            acc[curr.gender] = count
            return acc
          },
          { total: 0, name: range.date }
        )
      })
  })
}

function getInteractionRanges() {
  const ranges = getLastDaysRange()
  return Promise.mapSeries(ranges, range => {
    const inner = knex
      .from('analytics_interactions')
      .where(helpers(knex).date.isBetween('ts', range.start, range.end))
      .andWhere('direction', '=', 'in')
      .groupBy('user')
      .select(knex.raw('count(*) as c'))
      .toString()

    return knex.raw(
      `select
      sum(r1) as s1,
      sum(r2) as s2,
      sum(r3) as s3,
      sum(r4) as s4,
      sum(r5) as s5,
      sum(r6) as s6,
      sum(r7) as s7,
      sum(r8) as s8
    from (select 
      (select count(*) as count where c between 0 and 1) as r1,
      (select count(*) where c between 2 and 3) as r2,
      (select count(*) where c between 4 and 5) as r3,
      (select count(*) where c between 6 and 9) as r4,
      (select count(*) where c between 10 and 14) as r5,
      (select count(*) where c between 15 and 29) as r6,
      (select count(*) where c between 30 and 50) as r7,
      (select count(*) where c > 50) as r8
        from (` +
        inner +
        `) as q1 ) as q2`
    )
  })
    .then(rows => {
      if (rows[0].rows) {
        return rows.map(r => r.rows[0])
      } else {
        return rows.map(r => r[0])
      }
    })
    .then(results => {
      return results.reduce(
        function(acc, curr) {
          return _.mapValues(acc, (a, k) => {
            return a + (parseInt(curr[k]) || 0)
          })
        },
        { s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, s6: 0, s7: 0, s8: 0 }
      )
    })
    .then(results => {
      return [
        { name: '[0-2]', count: results.s1 },
        { name: '[2-4]', count: results.s2 },
        { name: '[4-6]', count: results.s3 },
        { name: '[6-10]', count: results.s4 },
        { name: '[10-15]', count: results.s5 },
        { name: '[15-30]', count: results.s6 },
        { name: '[30-50]', count: results.s7 },
        { name: '50+', count: results.s8 }
      ]
    })
}

function getAverageInteractions() {
  // Average incoming interactions per user per day for the last 7 days
  const lastWeek = moment(new Date())
    .subtract(7, 'days')
    .toDate()
  const now = helpers(knex).date.now()

  return knex
    .select(knex.raw('avg(c) as count'))
    .from(function() {
      return this.from('analytics_interactions')
        .where(helpers(knex).date.isBetween('ts', lastWeek, now))
        .andWhere('direction', '=', 'in')
        .groupBy(knex.raw('user, date(ts)'))
        .select(knex.raw('count(*) as c'))
        .as('q1')
    })
    .then()
    .get(0)
    .then(result => {
      return parseFloat(result.count) || 0.0
    })
}

function getNumberOfUsers() {
  // Get total number of active users for today, yesterday, this week

  const ranges = [
    {
      label: 'today',
      start: moment(new Date())
        .startOf('day')
        .toDate(),
      end: new Date()
    },
    {
      label: 'yesterday',
      start: moment(new Date())
        .subtract(1, 'days')
        .startOf('day')
        .toDate(),
      end: moment(new Date())
        .subtract(1, 'days')
        .endOf('day')
        .toDate()
    },
    {
      label: 'week',
      start: moment(new Date())
        .startOf('week')
        .toDate(),
      end: moment(new Date())
        .endOf('week')
        .toDate()
    }
  ]

  return Promise.mapSeries(ranges, range => {
    return knex
      .select(knex.raw('count(*) as count'))
      .from(function() {
        return this.from('analytics_interactions')
          .where(helpers(knex).date.isBetween('ts', range.start, range.end))
          .andWhere('direction', '=', 'in')
          .groupBy('user')
          .select(knex.raw(1))
          .as('q1')
      })
      .then()
      .get(0)
      .then(result => ({ label: range.label, count: result.count }))
  }).then(results => {
    return results.reduce((acc, curr) => {
      acc[curr.label] = curr.count
      return acc
    }, {})
  })
}

function usersRetention() {
  // Get the last 7 days cohort of users along with the retention rate

  let cohorts = _.times(8, n => Number(8 - n))
  cohorts = cohorts.map(n => {
    const day = moment().subtract(n, 'days')
    return {
      start: day.startOf('day').toDate(),
      end: day.endOf('day').toDate(),
      name: day.format('MMM Do'),
      date: day
    }
  })

  const result = {}

  // For each days of the cohort
  return Promise.mapSeries(cohorts, coo => {
    // Compute the cohort size [i.e. how many new users on this day?]
    return knex('users')
      .where(helpers(knex).date.isBetween('created_on', coo.start, coo.end))
      .select(knex.raw('count(*) as cohort_size'))
      .then()
      .get(0)
      .then(({ cohort_size }) => {
        cohort_size = parseFloat(cohort_size)

        // Compute the next 7 days of the cohort
        // and check how many users [from this cohort] spoke on or before this date
        // A user is considered as retentioned if he interacted with the bot any day after he onboarded

        const daysToAdd = _.times(7, n => n) // from 0 to 6
        return Promise.mapSeries(daysToAdd, dta => {
          const since = moment(coo.start)
            .add(dta, 'days')
            .endOf('day')
            .toDate() // +x days

          return knex
            .from(function() {
              this.from('analytics_interactions')
                .join('users', 'analytics_interactions.user', 'users.id')
                // where he is a member a this cohort
                .where(helpers(knex).date.isBetween('created_on', coo.start, coo.end))
                // and where he interacted with the bot since onboard+X days
                .andWhere(helpers(knex).date.isAfter('ts', since))
                // and where the user spoke, not the bot
                .andWhere('direction', '=', 'in')
                .groupBy('users')
                // returns the number of interactions per user
                .select(knex.raw('count(*) as interaction_count'))
                .as('q1')
            })
            .select(knex.raw('count(*) as partial_retention')) // return the total number of users
            .then()
            .get(0)
            .then(({ partial_retention }) => {
              partial_retention = parseFloat(partial_retention)

              // if the date is out of the cohort sample
              if (
                moment(since)
                  .startOf('day')
                  .isSameOrAfter(moment().startOf('day'))
              ) {
                return null
              }

              return partial_retention / cohort_size || 0
            })
        }).then(retention => {
          const mean = _.mean(_.filter(retention, v => v !== null))
          result[coo.name] = [cohort_size, ...retention, mean]
        })
      })
  }).then(() => result)
}

function getBusyHours() {
  const ranges = getLastDaysRange(7)
  const result = {}

  return Promise.mapSeries(ranges, range => {
    // select count(*) as count, ts from interactions
    // group by strftime('%H', ts/1000, 'unixepoch')
    return knex('analytics_interactions')
      .where(helpers(knex).date.isBetween('ts', range.start, range.end))
      .select(knex.raw('count(*) as count, ' + helpers(knex).date.hourOfDay('ts').sql + ' as ts'))
      .groupBy(helpers(knex).date.hourOfDay('ts'))
      .then(rows => {
        const row = []
        _.times(24, () => row.push(0))
        const biggest = rows.reduce((acc, curr) => {
          return (acc = curr.count > acc ? curr.count : acc)
        }, 0)
        rows.map(x => {
          row[parseInt(x.ts)] = Math.min(Number((x.count / biggest).toFixed(2)), 0.75)
        })

        result[range.date] = row
      })
  }).then(() => result)
}

function getLastRun() {
  return knex('analytics_runs')
    .orderBy('ts', 'desc')
    .limit(1)
    .then()
    .get(0)
    .then(entry => {
      return entry && moment(entry.ts)
    })
}

function setLastRun() {
  return knex('analytics_runs')
    .insert({ ts: helpers(knex).date.now() })
    .then(true)
}

module.exports = k => {
  knex = k
  return {
    getTotalUsers: getTotalUsers,
    getDailyActiveUsers: getDailyActiveUsers,
    getDailyGender: getDailyGender,
    getInteractionRanges: getInteractionRanges,
    getAverageInteractions: getAverageInteractions,
    getNumberOfUsers: getNumberOfUsers,
    usersRetention: usersRetention,
    getBusyHours: getBusyHours,
    getLastRun: getLastRun,
    setLastRun: setLastRun
  }
}
