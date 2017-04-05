module.exports = bp => {

  const addSecuredApi = app => {
    app.get('/api/my-account', async (req, res) => {

      const token = req.headers.authorization
      let user = await bp.security.authenticate(token)
      
      res.send(user)
    })

    return app
  }

  const addUnsecuredApi = app => {
    return app
  }

  return {
    name: '[Lite] Accounts Management',
    addSecuredApi,
    addUnsecuredApi
  }
}
