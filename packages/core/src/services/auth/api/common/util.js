import { ProcessingError } from '~/errors'

export default ({ db, config, authSvc }) => ({
  loadUser: async (req, res, next) => {
    let { iss: issuer, sub: id } = req.user || {}

    if (issuer === process.env.JWT_ISSUER || issuer === process.env.AUTH0_JWKS_ISSUER) {
      let user = await db.models.user.findOne({ where: { username: id } })
      if (!user) {
        return next(new ProcessingError('Unknown user: ' + id))
      }
      req.dbUser = user.toJSON()
    } else if (issuer === 'cli_token') {
      let user = await db.models.user.findOne({ where: { id: req.user.id } })
      req.dbUser = user.toJSON()
    } else if (id && id.length) {
      let user = await db.models.user.findOne({ where: { remoteId: id } })
      if (!user) {
        user = await authSvc.getOrCreateUser(id)
      }
      req.dbUser = user.toJSON()
    } else {
      return next(new ProcessingError('Unknown user token issuer: ' + issuer))
    }

    next()
  }
})
