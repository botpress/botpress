module.exports = (bp, app) => {

  const installSecured = () => {
    
    app.get('/api/my-account', async (req, res) => {
      res.send(req.user)
    })

  }

  const installAnonymous = () => {}

  return {
    name: '[Lite] Accounts Management',
    installSecured,
    installAnonymous
  }
}
