'use strict'

const _ = require('lodash')

const secret = process.env.EXPOSED_PRIVATE_API_SECRET

const privateAuthentication = (req, res, next) => {
  const auth = _.get(req, 'headers.authorization', '').toLowerCase()
  const parts = auth.split(' ').filter(x => x.length)
  if (parts.length !== 2 || parts[0] !== 'bearer' || parts[1] !== secret) {
    return res.sendStatus(403) // Unauthorized
  }
  next()
}

/**
 * This hook will create a private API (secured with a custom secret)
 * You must authenticate with your token to access this API
 * HTTP headers must include: `authorization: bearer YOUR_SECRET_HERE`
 */
const exposeApi = async () => {
  if (!secret || !secret.length) {
    return bp.logger.warn(
      'Custom API disabled because you did not provide an API secret (set the "EXPOSED_PRIVATE_API_SECRET" env variable)'
    )
  }

  const router = bp.http.createRouterForBot('private-api', {
    checkAuthentication: false
  })

  router.use(privateAuthentication)

  /*
    This route exposes a route to create trusted chat references for your webchat visitors
    There are three ways you can use the generated signature:
    1. Standalone Webchat: Append the reference to the URL of the chat, e.g. http://<bot_url>/s/your_bot?ref=[reference]=[signature]
    2. Embedded Webchat: Add the `ref` to the webchat init options. e.g. `{ ref: '[reference]=[signature]', host: ... }`
    3. Send a custom Incoming Event (using the SDK), see the built-in hook "after_incoming_middleware/02_set_session_reference.js"
  */
  router.get('/chat-reference/:reference', async (req, res, next) => {
    try {
      const reference = req.params.reference
      const signature = await bp.security.getMessageSignature(req.params.reference)
      res.send({ reference, signature, full: `${reference}=${signature}` })
    } catch (err) {
      bp.logger.attachError(err).error('Error generating signature')
      res.send(500)
    }
  })

  let apiUrl = await router.getPublicPath()
  apiUrl = apiUrl.replace('BOT_ID', '___')
  bp.logger.info(`Private API Path is ${apiUrl}`)
}

return exposeApi()
