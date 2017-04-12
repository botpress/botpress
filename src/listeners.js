import _ from 'lodash'

const matches = function(conditions, event) {
  if (!_.isPlainObject(conditions)) {
    conditions = { text: conditions }
  }

  const pairs = _.toPairs(conditions)
  return _.every(pairs, ([key, comparrer]) => {
    const eventValue = _.get(event, key, null)

    if (_.isFunction(comparrer)) {
      return comparrer(eventValue, event) === true
    } else if (_.isRegExp(comparrer)) {
      return comparrer.test(eventValue)
    } else {
      return _.isEqual(comparrer, eventValue)
    }
  })
}

const hear = function(conditions, callback) {
  return (event, next) => {
    const result = matches(conditions, event)

    if (result && _.isFunction(callback)) {
      if (callback.length <= 1) {
        if (_.isFunction(next)) { 
          next()
        }
        callback(event)
      } else {
        callback(event, next)
      }
    } else {
      if (_.isFunction(next)) { 
        next()
      }
    }
  }
}

module.exports = { hear, matches }
