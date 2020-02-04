import _ from 'lodash'
import moment from 'moment'

export default class Stats {
  constructor(private knex) {}

  rangeDates() {
    return this.knex('srv_channel_users')
      .select(this.knex.raw('max(created_at) as max, min(created_at) as min'))
      .then()
      .get(0)
      .then(result => {
        if (!result.min || !result.max) {
          return undefined
        }

        const range = moment(result.max).diff(moment(result.min), 'days')
        const ranges = []
        for (let i = 1; i <= 10; i++) {
          ranges.push(parseInt(result.min + (range / 10) * i))
        }
        const ret = {
          min: result.min,
          max: result.max,
          format: undefined,
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

  getTotalUsers() {
    return this.rangeDates().then(dates => {
      if (!dates) {
        return
      }
      return this.knex('srv_channel_users')
        .select(this.knex.raw('distinct channel'))
        .then(channels => {
          const statsBase = channels.reduce(
            (acc, curr) => {
              acc[curr.channel] = 0
              return acc
            },
            { total: 0 }
          )

          return this.knex('srv_channel_users')
            .select(this.knex.raw('count(*) as count, max(created_at) as date, channel'))
            .groupBy(this.knex.raw('date(created_at), channel'))
            .orderBy(this.knex.raw('date(created_at)'))
            .then(rows => {
              let total = 0
              const totalChannel = {}
              const result = {}
              const min = dates.format(moment(new Date(dates.min)).subtract(1, 'day'))
              result[min] = Object.assign({}, statsBase)

              rows.map(row => {
                const date = dates.format(row.date)
                if (!result[date]) {
                  result[date] = Object.assign({}, statsBase)
                }
                if (!totalChannel[row.channel]) {
                  totalChannel[row.channel] = 0
                }
                const count = parseInt(row.count)
                totalChannel[row.channel] += count
                result[date].total = total += count
                result[date][row.channel] = totalChannel[row.channel]
              })

              const max = dates.format(moment(new Date(dates.max)).add(1, 'hour'))
              result[max] = Object.assign({}, statsBase, { total: total }, totalChannel)

              return _.toPairs(result).map(([k, v]) => {
                v['name'] = k
                return v
              })
            })
        })
    })
  }

  getLastDaysRange(nb?) {
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

  getDailyActiveUsers() {
    const ranges = _.reverse(this.getLastDaysRange())
    return Promise.mapSeries(ranges, range => {
      return this.knex('analytics_interactions as ai')
        .select(this.knex.raw('count(*) as count, ai.channel'))
        .join('srv_channel_users', 'srv_channel_users.user_id', 'ai.user_id')
        .where(this.knex.date.isBetween('ts', range['start'], range['end']))
        .where('direction', '=', 'in')
        .groupBy(['ai.user_id', 'ai.channel'])
        .then(results => {
          return results.reduce(
            function(acc, curr) {
              const count = parseInt(curr.count)
              acc.total += count
              acc[curr.channel] = count

              return acc
            },
            { total: 0, name: range['date'] }
          )
        })
    })
  }

  // FIXME: Fix or remove, gender is not a valid column anymore
  // getDailyGender() {
  //   const ranges = _.reverse(this.getLastDaysRange())
  //   return Promise.mapSeries(ranges, range => {
  //     return this.knex('analytics_interactions')
  //       .select(this.knex.raw('count(*) as count, gender'))
  //       .join('users', 'users.id', 'analytics_interactions.user')
  //       .where(this.knex.date.isBetween('ts', range.start, range.end))
  //       .andWhere('direction', '=', 'in')
  //       .groupBy(['user', 'gender'])
  //       .then(results => {
  //         return results.reduce(
  //           function(acc, curr) {
  //             const count = parseInt(curr.count)
  //             acc.total += count
  //             acc[curr.gender] = count
  //             return acc
  //           },
  //           { total: 0, name: range.date }
  //         )
  //       })
  //   })
  // }

  getInteractionRanges() {
    const ranges = this.getLastDaysRange()
    return Promise.mapSeries(ranges, range => {
      const inner = this.knex
        .from('analytics_interactions')
        .where(this.knex.date.isBetween('ts', range['start'], range['end']))
        .andWhere('direction', '=', 'in')
        .groupBy('user_id')
        .select(this.knex.raw('count(*) as c'))
        .toString()

      return this.knex.raw(
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

  getAverageInteractions() {
    // Average incoming interactions per user per day for the last 7 days
    const lastWeek = moment(new Date())
      .subtract(7, 'days')
      .toDate()
    const now = this.knex.date.now()
    const knx = this.knex

    return this.knex
      .select(this.knex.raw('avg(c) as count'))
      .from(function() {
        return this.from('analytics_interactions')
          .where(knx.date.isBetween('ts', lastWeek, now))
          .andWhere('direction', '=', 'in')
          .groupBy(knx.raw('user_id, date(ts)'))
          .select(knx.raw('count(*) as c'))
          .as('q1')
      })
      .then()
      .get(0)
      .then(result => {
        return parseFloat(result.count) || 0.0
      })
  }

  getNumberOfUsers() {
    const knx = this.knex
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
      return this.knex
        .select(this.knex.raw('count(*) as count'))
        .from(function() {
          return this.from('analytics_interactions')
            .where(knx.date.isBetween('ts', range['start'], range['end']))
            .andWhere('direction', '=', 'in')
            .groupBy('user_id')
            .select(knx.raw(1))
            .as('q1')
        })
        .then()
        .get(0)
        .then(result => ({ label: range['label'], count: result.count }))
    }).then(results => {
      return results.reduce((acc, curr) => {
        acc[curr.label] = curr.count
        return acc
      }, {})
    })
  }

  usersRetention() {
    const knx = this.knex
    // Get the last 7 days cohort of users along with the retention rate
    let cohorts: any = _.times(8, n => Number(8 - n))
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
      const cohortStart = _.get(coo, 'start')
      const cohortEnd = _.get(coo, 'end')
      const cohortName = _.get(coo, 'name')

      // Compute the cohort size [i.e. how many new users on this day?]
      return this.knex('srv_channel_users')
        .where(this.knex.date.isBetween('created_at', cohortStart, cohortEnd))
        .select(this.knex.raw('count(*) as cohort_size'))
        .then()
        .get(0)
        .then(({ cohort_size }) => {
          cohort_size = parseFloat(cohort_size)

          // Compute the next 7 days of the cohort
          // and check how many users [from this cohort] spoke on or before this date
          // A user is considered as retentioned if he interacted with the bot any day after he onboarded

          const daysToAdd = _.times(7, n => n) // from 0 to 6
          return Promise.mapSeries(daysToAdd, dta => {
            const since = moment(cohortStart)
              .add(dta, 'days')
              .endOf('day')
              .toDate() // +x days

            return this.knex
              .from(function() {
                this.from('analytics_interactions')
                  .join('srv_channel_users', 'analytics_interactions.user_id', 'srv_channel_users.user_id')
                  // where he is a member a this cohort
                  .where(knx.date.isBetween('created_at', cohortStart, cohortEnd))
                  // and where he interacted with the bot since onboard+X days
                  .andWhere(knx.date.isAfter('ts', since))
                  // and where the user spoke, not the bot
                  .andWhere('direction', '=', 'in')
                  .groupBy('srv_channel_users.user_id')
                  // returns the number of interactions per user
                  .select(knx.raw('count(*) as interaction_count'))
                  .as('q1')
              })
              .select(this.knex.raw('count(*) as partial_retention')) // return the total number of users
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
                  return undefined
                }

                return partial_retention / cohort_size || 0
              })
          }).then(retention => {
            const mean = _.mean(_.filter(retention, v => v !== undefined))
            result[cohortName] = [cohort_size, ...retention, mean]
          })
        })
    }).then(() => result)
  }

  getBusyHours() {
    const ranges = this.getLastDaysRange(7)
    const result = {}

    return Promise.mapSeries(ranges, range => {
      // select count(*) as count, ts from interactions
      // group by strftime('%H', ts/1000, 'unixepoch')
      return this.knex('analytics_interactions')
        .where(this.knex.date.isBetween('ts', range.start, range.end))
        .select(this.knex.raw('count(*) as count, ' + this.knex.date.hourOfDay('ts').sql + ' as ts'))
        .groupBy(this.knex.date.hourOfDay('ts'))
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

  getLastRun() {
    return this.knex('analytics_runs')
      .orderBy('ts', 'desc')
      .limit(1)
      .then()
      .get(0)
      .then(entry => {
        return entry && moment(entry.ts)
      })
  }

  async setLastRun() {
    return this.knex('analytics_runs').insert({ ts: this.knex.date.now() })
  }
}
