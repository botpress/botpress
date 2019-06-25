---
id: chat-3rd-party-OAuth
title: Authenticate a user against a 3rd Party OAuth
---

## Overview

Ever wanted to authenticate a user against a 3rd party authentication system to act on its behalf, just like you would do in a mobile/web app? In this tutorial, we will do just that. We will build a simple module that authenticates a user to Twitter and save its credentials to its attributes so it can be used to query its Twitter account.

> **Prerequisites:** We assume that you have a knowledge on how to [create a custom botpress module](../advanced/custom-module), that you have a basic knowledge of the [botpress sdk](/reference/) as well as prior experience with `botpress.config.json`. We also assume that you created a [Twitter app](https://developer.twitter.com/en/docs/basics/getting-started) and that you have some previous experience with [Passport.js](http://www.passportjs.org/docs/).

The code for this example is available in the [examples](https://github.com/botpress/botpress/tree/master/examples/chat-3rd-party-OAuth) directory of our GitHub repository.

## Register the module

Botpress modules provide a simple yet powerful way extend your bot capabilities without altering the core features. If we think about our use case here, the only thing that our module has to do is to offer an api so we can perform the steps to authenticate the user to Twitter. No UI, no middlewares, only an api and some configs is required. First of create an `src` directory with 2 sub dirs `backend` and `views`. Then, go ahead and write a simple module entry point (backend/index.ts).

```ts
import * as sdk from 'botpress/sdk'

const onServerStarted = async (bp: typeof sdk) => {}

const onServerReady = async (bp: typeof sdk) => {}

const onBotMount = async (bp: typeof sdk, botId: string) => {}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  definition: {
    name: 'twitter-auth',
    fullName: 'Twitter oAuth1 example',
    homepage: 'https://botpress.io',
    noInterface: true
  }
}

export default entryPoint
```

Now that we have the shell of our module setup, we need to activate it in our `botpress.config.json` so the botpress module builder can easily find and build it.

```js
{
  // MODULES_ROOTS is the modules directory, you can yse your own location
  "location": "MODULES_ROOT/twitter-auth",
  "enabled": true
}
```

## Module implementation

Now that we have a working module let's get into the implementation. For simplycity we will use Passport.js along with a Twitter Strategy to implement the OAuth flow. Go ahead an install those deps. Once that done, we will need to add our Twitter App api keys so that our bot can properly authenticate the user to Twitter. We acheive this by creating a module config file for each bot. Config here is pretty simple, obviously you can customize it for your needs. Add the following file in the config directory of desired bots:

```js
// bots/yourbot/config/twitter-auth.json
{
  "enabled": true,
  "apiKey": "YOUR_TWITTER_APP_API_KEY"
  "apiSecret": "YOUR_TWITTER_APP_SECRET_KEY"
}
```

Next step, is to implement the `onBotMount` function the in our `module/src/index.ts` that will configure the Passport Twitter straregy for each bot.

```ts
const onBotMount = async (bp: typeof sdk, botId) => {
  const modConfig = (await bp.config.getModuleConfigForBot('twitter-auth', botId)) as Config
  if (!modConfig.enabled) {
    return
  }

  // We use process variables that are set on server start from botpress config file, we could use the configs
  // const bpConfig = await bp.config.getBotpressConfig()
  // const baseCallbackUrl = bpConfig.externalUrl || `http://${bpConfig.host}:${bpConfig.port}`
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
```

Now it you try to run botpress, you will have an error because the Passport Twitter Strategy needs a server session which is disabled by default, enable it in your botpress config : set `httpServer.session.enabled` to `true`. If you start the server again, botpress should be running properly. Great, now notice that we need point Twitter to a callbackUrl so it can provide the authentication values. Let's implement that callback url for the bot in particular, thankfully botpress http sdk offers `createRouterForBot` that allows us to define a custom module router for a specific bot. We will define our router in the `onServerReady` function of our module entry point.

```ts
const onServerReady = async (bp: typeof sdk) => {
  const router = bp.http.createRouterForBot('twitter-auth', { checkAuthentication: false }) as Router

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
```

The only step missing is to find a way to send the user to Twitter Authentication. We will simply define a route in our router in which we call passport to initiate the authentication flow. The following route in custom router does the trick.

```ts
router.get('/auth', async (req: ReqWithSession, res) => {
  req.session.channel = req.query.channel
  req.session.userId = req.query.userId

  passport.authenticate('twitter')(req, res)
})
```

That's it you can now use read Twitter Authentication properties in the users's attributes. Depending on your business logic, when a user needs to be authenticated to Twitter, you now simply have to check if the `twitter` property set in the users attributes. If it's not set then you need to suggest to your user to to authenticate to Twitter, you could for instance display a builtin card element with `OpenUrl` as action with our authentication route as url value : `http://yourbot.host/api/v1/bots/${botId}/mod/twitter-auth/auth?channel=${chanelId}&userId=${userId}`. Notice that we pass `channel` & `userId` as query params so we can set it in the user's session, it'll be used to find the user when our callback route is called by Twitter.

> **Pro tip:** Define a [shortlink](/docs/tutorials/shortlinks) for our auth bot module route to make it easy to use on your flow or content.

That's about it. As a quick recap, in this tutorial, we built a very simple module with no interface from scratch that allows a Twitter OAuth flow in a chat session. Of course you could (and should) extend this module for your own needs. The simplicity of this implementation shows that the same concepts can be applied to other Auth Providers. You could even combine different Authentication Providers so you can perform different actions on the authenticated user's behalf for instance book a Uber Ride and share it to twitter (not that this is a useful usecase). Full code example is available on [GitHub](https://github.com/botpress/botpress/tree/master/examples/chat-3rd-party-OAuth).

Enjoy extending Botpress.
