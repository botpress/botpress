module.exports = (bp, app) => {
  app.get('/api/auth/info', async (req, res) => {
    bp.stats.track('api', 'auth', 'info')
    res.json(bp.security.getAuthenticationInfo())
  })

  app.post('/api/auth/refresh_token', async (req, res) => {
    bp.stats.track('api', 'auth', 'refresh_token')
    const result = await bp.security.refreshToken(req.headers.authorization)
    if (result.success) {
      res.send(result.token)
    } else {
      res.status(400).send(result.reason)
    }
  })

  app.post('/api/login', async (req, res) => {
    bp.stats.track('api', 'auth', 'login')
    const result = await bp.security.login(req.body.user, req.body.password, req.ip)
    res.send(result)
  })
}
