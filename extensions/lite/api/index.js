import accounts from '+/api/accounts'

module.exports = (bp, app) => ({
  anonymous: [accounts(bp, app).installAnonymous],
  secured: [accounts(bp, app).installSecured]
})
