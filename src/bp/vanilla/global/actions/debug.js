/**
 * This is a public Async action
 * @author Botpress, Inc.
 * @param {string} [str] Just a regular string argument
 */

return new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve(true)
  }, 250)
})
