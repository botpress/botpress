import _ from 'lodash'

const matches = (conditions, event) => {
  if (!_.isPlainObject(conditions)) {
    conditions = { text: conditions }
  }

  const pairs = _.toPairs(conditions)
  return _.every(pairs, ([key, comparrer]) => {
    const eventValue = _.get(event, key, null)

    if (_.isFunction(comparrer)) {
      return comparrer(eventValue, event) === true
    } else if (_.isRegExp(comparrer)) {
      const matches = comparrer.test(eventValue)

      if (matches && _.isString(eventValue)) {
        if (_.isNil(event.captured)) {
          event.captured = []
        }

        const a = _.tail(comparrer.exec(eventValue))
        a.forEach(m => event.captured.push(m))
      }

      return matches
    } else {
      return _.isEqual(comparrer, eventValue)
    }
  })
}

const hear = (conditions, callback) => {
  return (event, next) => {
    let result = false
    if (_.isFunction(conditions)) {
      result = conditions(event)
    } else if (_.isArray(conditions)) {
      for (const conditionsItem of conditions) {
        if (matches(conditionsItem, event)) {
          result = true
          break
        }
      }
    } else {
      result = matches(conditions, event)
    }

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
