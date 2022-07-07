/**
 * @hidden true
 */

/**
 * Initiate temporary variables for skills usage
 * @title Initiate variables
 * @category Slot
 * @author Botpress, Inc.
 */

const _ = require('lodash')

const initVariables = async args => {
  for (const key of Object.keys(args)) {
    _.set(event.state, key, args[key])
  }
}

return initVariables(args)
