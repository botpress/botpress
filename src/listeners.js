import _ from 'lodash'

const hear = function(conditions, callback) {
  if(!_.isPlainObject(conditions)) {
    conditions = { text: conditions }
  }

  return (event, next) => {
    const pairs = _.toPairs(conditions)
    const result = _.every(pairs, ([key, comparrer]) => {
      const eventValue = _.get(event, key, null)

      if (_.isFunction(comparrer)) {
        return comparrer(eventValue, event) === true
      } else if (_.isRegExp(comparrer)) {
        return comparrer.test(eventValue)
      } else {
        return _.isEqual(comparrer, eventValue)
      }      
    })

    if(result && _.isFunction(callback)) {
      if(callback.length <= 1) {
        if(_.isFunction(next)) { 
          next()
        }
        callback(event)
      } else {
        callback(event, next)
      }
    } else {
      if(_.isFunction(next)) { 
        next()
      }
    }
  }
}

module.exports = { hear }
