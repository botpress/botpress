import moment from 'moment'
import later from 'later'
import _ from 'lodash'

const cronstrue = require('cronstrue')

const getNextOccurence = (type, exp) => {
  switch (type.toLowerCase()) {
    case 'cron':
      cronstrue.toString(exp) // Validation
      later.date.localTime()
      const sched1 = later.parse.cron(exp)
      const next1 = later.schedule(sched1).next(
        2,
        moment()
          .add(5, 'seconds')
          .toDate()
      )[0]
      return moment(new Date(next1))
    case 'natural':
      later.date.localTime()
      const sched2 = later.parse.text(exp)
      const next2 = later.schedule(sched2).next(
        2,
        moment()
          .add(5, 'seconds')
          .toDate()
      )[1]
      return moment(new Date(next2))
    case 'once':
      return moment(new Date(exp))
  }
}

const validateExpression = (type, exp) => {
  if (!_.includes(['cron', 'natural', 'once'], type.toLowerCase())) {
    throw new Error('Invalid expression type: ' + type)
  }

  getNextOccurence(type, exp)
}

const getHumanExpression = (type, exp) => {
  switch (type.toLowerCase()) {
    case 'cron':
      return cronstrue.toString(exp)
    case 'once':
      return 'Once, ' + moment(new Date(exp)).fromNow()
    case 'natural':
      return exp
    default:
      throw new Error('Unknown type: ' + type)
  }
}

module.exports = { getNextOccurence, validateExpression, getHumanExpression }
