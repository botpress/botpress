import ExtraApiProviders from '+/api'

module.exports = (bp, app) => {

  app.post('/api/login', async (req, res) => {
    bp.stats.track('api', 'auth', 'login')
    const result = await bp.security.login(req.body.user, req.body.password, req.ip)
    res.send(result)
  })

  const apis = ExtraApiProviders(bp, app)
  apis.anonymous.map(x => x && x()) // Install all anonymous APIs
  
}
