---
id: user-auth
title: User Authentication
--- 

Let's authenticate a user against a 3rd party authentication system to act on its behalf, just like you would do in a mobile/web app. To achieve this, we will build a simple module that authenticates a user to Twitter. After authentication, it will save the user's credentials to their attributes to query the user's Twitter account later.

> **Prerequisites:** 
> Knowledge on how to [create a custom botpress module](../advanced/custom-module).
> Basic knowledge of the [botpress sdk](https://botpress.com/reference/) as well as prior experience with `botpress.config.json`. 
> A [Twitter app](https://developer.twitter.com/en/docs/basics/getting-started).
> Experience with [Passport.js](http://www.passportjs.org/docs/).

The code for this example is available in the [examples](https://github.com/botpress/botpress/tree/master/examples/chat-3rd-party-OAuth) directory of our GitHub repository.

### Module Registration
Botpress modules provide a simple yet powerful way to extend your chatbot capabilities without altering the core features. For our use case, our module's main functionality is to offer an API so we can perform the steps to authenticate the user to Twitter. No UI, no middlewares, only an API, and some configs are required. First off, create a `src` directory with two subdirectories, `backend` and `views`. Then, go ahead and write a simple module entry point (backend/index.ts).

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
    homepage: 'https://botpress.com',
    noInterface: true
  }
}

export default entryPoint
```

Now that we have the shell of our module setup, we need to activate it in our `botpress.config.json` so the botpress module builder can easily find and build it.

```js
{
  // MODULES_ROOTS is the modules directory. You can use your bespoke location.
  "location": "MODULES_ROOT/twitter-auth",
  "enabled": true
}
```

### Module Implementation
For simplicity, we will use Passport.js along with a Twitter Strategy to implement the OAuth flow. Go ahead and install those dependencies. 

Once done, we need to add our Twitter App API keys so that our chatbot can properly authenticate the user to Twitter. We achieve this by creating a module config file for each bot. Add the following file in the config directory of desired chatbots:

```js
// bots/yourbot/config/twitter-auth.json
{
  "enabled": true,
  "apiKey": "YOUR_TWITTER_APP_API_KEY"
  "apiSecret": "YOUR_TWITTER_APP_SECRET_KEY"
}
```

The next step is to implement the `onBotMount` function in our `module/src/index.ts` to configure the Passport Twitter strategy for each bot.

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

If you try to run Botpress at this point, you will have an error because the Passport Twitter Strategy requires a disabled server session by default. Enable it in your `botpress.config.json` file by setting `httpServer.session.enabled` to `true`. Restart the server; Botpress should be running properly. 

Now we need to point Twitter to a callback URL so it can provide the authentication values. Let's implement that callback url for our chatbot using `createRouterForBot`, available from the Botpress HTTP SDK. This function allows us to define a custom module router for a specific bot. We will define our router in the `onServerReady` function of our module entry point.

```ts
const onServerReady = async (bp: typeof sdk) => {
  const router = bp.http.createRouterForBot('twitter-auth', { checkAuthentication: false }) as Router

  router.get('/callback', async (req: ReqWithSession, res) => {
    passport.authenticate('twitter', {}, async (err, twitterUserDat) => {
      if (err) {
        /*
          Twitter authentication error
          Your Error handling code goes here.
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
          Your Error handling code goes here.
         */
        res.redirect('/CUSTOM_AUTH_ERROR_ROUTE')
      }
    })(req, res)
  })
}
```

Now we need to find a way to send the user to Twitter Authentication. We will define a route in our router that we call passport.js to initiate the authentication flow. The following route in a custom router does the trick.

```ts
router.get('/auth', async (req: ReqWithSession, res) => {
  req.session.channel = req.query.channel
  req.session.userId = req.query.userId

  passport.authenticate('twitter')(req, res)
})

``` 
Notice that we pass `channel` & `userId` as query parameters to set them in the user's session. Botpress will use these parameters to find the user when Twitter calls our callback route.
Your chatbot can now use the read Twitter Authentication properties in the users' attributes. Depending on your business logic, when you need to authenticate a user to Twitter, you only have to check if the user's attributes contain the `twitter` property. If the user has not yet set this property, suggest to your user to authenticate to Twitter. You could achieve this by displaying a built-in card element with an `OpenUrl` action. Set your authentication route as the url value : `http://yourbot.host/api/v1/bots/${botId}/mod/twitter-auth/aut

> **Pro tip:** Define a [shortlink](/docs/tutorials/shortlinks) for your auth chatbot module route to make it easy to use in your flow or content.

### Recap
- We built a simple module with no interface from scratch that allows a Twitter OAuth flow in a chat session. 
- You could (and should) extend this module for your own needs. 
- The simplicity of this implementation shows that you can apply the same concepts to other Auth Providers. 
- You could even combine different Authentication Providers to perform various actions on the authenticated user's behalf. For instance, book a Uber Ride and share it on Twitter (not that this is a helpful use-case). 
- A complete code example is available on [GitHub](https://github.com/botpress/botpress/tree/master/examples/chat-3rd-party-OAuth).
