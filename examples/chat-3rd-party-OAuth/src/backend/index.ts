import * as sdk from 'botpress/sdk'
import { Request, Router } from 'express'
import passport from 'passport'
import TwitterStrategy from 'passport-twitter'

import { Config } from '../config'

interface ReqWithSession extends Request {
  session: any
}

const onServerStarted = async (bp: typeof sdk) => {}

const onServerReady = async (bp: typeof sdk) => {
  const router = bp.http.createRouterForBot('twitter-auth', { checkAuthentication: false }) as Router
  router.get('/auth', async (req: ReqWithSession, res) => {
    req.session.channel = req.query.channel
    req.session.userId = req.query.userId

    passport.authenticate('twitter')(req, res)
  })

  router.get('/callback', async (req: ReqWithSession, res) => {
    passport.authenticate('twitter', {}, async (err, twitterUserDat) => {
      if (err) {
        /*
          Twitter authentication error
          Your Error handling code goes here
         */
        res.redirect('/')
      }

      try {
        await bp.users.updateAttributes(req.session.channel, req.session.userId, { twitter: twitterUserDat })
        // This will simply close the authentication window
        res.send('<div>Twitter auth success!</div><script>window.setTimeout(window.close, 1500)</script>')
      } catch (err) {
        /*
          Update user attributes error
          Your Error handling code goes here
         */
        res.redirect('/CUSTOM_AUTH_ERROR_ROUTE')
      }
    })(req, res)
  })
}

const onBotMount = async (bp: typeof sdk, botId) => {
  const modConfig = (await bp.config.getModuleConfigForBot('twitter-auth', botId)) as Config
  if (!modConfig.enabled) {
    return
  }

  // We use process variables that are set on server start from botpress config file, we could use the configs
  // const bpConfig = await bp.config.getBotpressConfig()
  // const baseCallbackUrl = bpConfig.externalUrl || `http://${bpConfig.host}:${bpConfig.port}`
  // @ts-ignore
  const baseCallbackUrl = process.EXTERNAL_URL || `http://${process.HOST}:${process.PORT}`

  passport.use(
    new TwitterStrategy(
      {
        consumerKey: modConfig.apiKey,
        consumerSecret: modConfig.apiSecret,
        callbackUrl: `${baseCallbackUrl}/api/v1/bots/${botId}/mod/twitter-auth/callback`
      },
      (token: string, tokenSecret: string, profile: any, done: Function) => {
        done(undefined, { token, tokenSecret, profile })
      }
    )
  )
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  definition: {
    name: 'twitter-auth',
    fullName: 'Twitter oAuth1 example',
    homepage: 'https://botpress.com',
    noInterface: true
  }
}

export default entryPoint
