import Promise from 'bluebird'

const CircularJSON = require('circular-json')

module.exports = {
  init: function(bp) {},
  ready: function(bp) {
    bp.getRouter('botpress-terminal').post('/run', (req, res) => {
      const code = req.body && req.body.code

      if (!code) {
        return res.status(500).send({ message: 'You must provide the `code` to run in the body' })
      }

      const fromDate = new Date()

      const handleResult = success => result => {
        bp.logger.query(
          {
            from: fromDate,
            until: new Date(),
            order: 'asc',
            fields: ['level', 'message', 'timestamp']
          },
          (err, results) => {
            if (!success) {
              res.status(500)
            }

            res.send({
              logs: results.file,
              result: success ? CircularJSON.stringify(result) : null,
              message: success ? null : result.message
            })
          }
        )
      }

      const fn = new Function('bp', 'knex', code)
      bp.db.get().then(knex => {
        Promise.method(fn)
          .call(null, bp, knex)
          .then(handleResult(true))
          .catch(handleResult(false))
      })
    })
  }
}
