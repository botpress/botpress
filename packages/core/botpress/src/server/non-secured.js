import fs from 'fs'
import path from 'path'

import util from '../util'

module.exports = (bp, app) => {
  app.get('/api/ping', (req, res) => {
    res.send('pong')
  })

  app.get('/api/license', async (req, res) => {
    res.send(await bp.licensing.getLicensing())
  })

  app.delete('/api/guided-tour', (req, res) => {
    fs.unlink(path.join(bp.projectLocation, '.welcome'), () => {
      bp.isFirstRun = false
      res.sendStatus(200)
    })
  })

  app.get('/api/my-account', async (req, res) => {
    const roles = await bp.cloud.getUserRoles(req.user.roles)
    res.send({ ...req.user, roles })
  })
}
