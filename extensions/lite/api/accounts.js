module.exports = (bp, app) => {

  const installSecured = () => {
    
    app.get('/api/my-account', async (req, res) => {
      const token = req.headers.authorization
      let user = await bp.security.authenticate(token)
      res.send(user)
    })

  }

  const installAnonymous = () => {}

  return {
    name: '[Lite] Accounts Management',
    installSecured,
    installAnonymous
  }
}
