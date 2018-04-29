'use strict'

module.exports = function printErrors(errorInstance) {
  if (Array.isArray(errorInstance.errors)) {
    errorInstance.errors.forEach(lintError => {
      console.error(lintError.message)
    })
  } else {
    console.error(errorInstance.message)
  }
}
