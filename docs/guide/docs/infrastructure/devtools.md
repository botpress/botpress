---
id: devtools
title: Developer Tools & Techniques
---

## 3rd Party OAuth User Authentication

Let's authenticate a user against a 3rd party authentication system to act on its behalf, just like you would do in a mobile/web app. To achieve this, we will build a simple module that authenticates a user to Twitter. After authentication, it will save the user's credentials to their attributes to query the user's Twitter account later.

> **Prerequisites:** 
> Knowledge on how to [create a custom botpress module](../advanced/custom-module).
> Basic knowledge of the [botpress sdk](https://botpress.com/reference/) as well as prior experience with `botpress.config.json`. 
> A [Twitter app](https://developer.twitter.com/en/docs/basics/getting-started).
> Experience with [Passport.js](http://www.passportjs.org/docs/).

The code for this example is available in the [examples](https://github.com/botpress/botpress/tree/master/examples/chat-3rd-party-OAuth) directory of our GitHub repository.

### Module Registration
Botpress modules provide a simple yet powerful way to extend your bot capabilities without altering the core features. For our use case, our module's main functionality is to offer an API so we can perform the steps to authenticate the user to Twitter. No UI, no middlewares, only an API, and some configs are required. First off, create a `src` directory with two subdirectories, `backend` and `views`. Then, go ahead and write a simple module entry point (backend/index.ts).

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
  // MODULES_ROOTS is the modules directory, you can use your bespoke location
  "location": "MODULES_ROOT/twitter-auth",
  "enabled": true
}
```

### Module Implementation

Now that we have a working module let's get into the implementation. For simplicity, we will use Passport.js along with a Twitter Strategy to implement the OAuth flow. Go ahead and install those dependencies. 

Once done, we need to add our Twitter App API keys so that our bot can properly authenticate the user to Twitter. We achieve this by creating a module config file for each bot. Add the following file in the config directory of desired bots:

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

Now we need to point Twitter to a callback URL so it can provide the authentication values. Let's implement that callback url for our bot using `createRouterForBot`, available from the Botpress HTTP SDK. This function allows us to define a custom module router for a specific bot. We will define our router in the `onServerReady` function of our module entry point.

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

Now we need to find a way to send the user to Twitter Authentication. We will define a route in our router in which we call passport.js to initiate the authentication flow. The following route in a custom router does the trick.

```ts
router.get('/auth', async (req: ReqWithSession, res) => {
  req.session.channel = req.query.channel
  req.session.userId = req.query.userId

  passport.authenticate('twitter')(req, res)
})
```

That's it; you can now use read Twitter Authentication properties in the users' attributes. Depending on your business logic, when you need to authenticate a user to Twitter, you only have to check if the `twitter` property is set in the user's attributes. If the user has not yet set this property, suggest to your user to authenticate to Twitter. You could achieve this by displaying a built-in card element with an `OpenUrl` action. Set your authentication route as the url value : `http://yourbot.host/api/v1/bots/${botId}/mod/twitter-auth/auth?channel=${chanelId}&userId=${userId}`. Notice that we pass `channel` & `userId` as query parameters so we can set them in the user's session. Botpress will use these parameters to find the user when Twitter calls our callback route.

> **Pro tip:** Define a [shortlink](/docs/tutorials/shortlinks) for your auth bot module route to make it easy to use in your flow or content.

### Recap
- We built a simple module with no interface from scratch that allows a Twitter OAuth flow in a chat session. 
- You could (and should) extend this module for your own needs. 
- The simplicity of this implementation shows that you can apply the same concepts to other Auth Providers. 
- You could even combine different Authentication Providers to perform different actions on the authenticated user's behalf. For instance, book a Uber Ride and share it on Twitter (not that this is a useful use-case). 
- A full code example is available on [GitHub](https://github.com/botpress/botpress/tree/master/examples/chat-3rd-party-OAuth).

## Shortlinks

In Botpress, you can natively create short links to your bot and get the following benefits:

1. Short URLs - no one likes a long URL
2. Flexibility - it allows you to change any of the parameters without affecting the URL

### Implementation
In the example below, our new shortlink `/s/fs-wc` will redirect a user to `/lite/botId?m=platform-webchat&v=fullscreen` (the standard webchat interface). You can specify additional parameters in the options object.

Create a bot-scoped `after_bot_mount` hook with the following code:

```js
bp.http.createShortLink('fs-wc', `${process.EXTERNAL_URL}/lite/${botId}/`, {
  m: 'channel-web',
  v: 'fullscreen',
  options: JSON.stringify({
    config: {
      /* Custom config here... */
    }
  })
})
```
### Resources
See the views' [Config](https://github.com/botpress/botpress/blob/master/modules/channel-web/src/views/lite/typings.d.ts#L130) object for all available options.

It is recommended to also create a hook `after_bot_unmount`, to remove the shortlink when the bot is disabled; here is the corresponding example:

```js
bp.http.deleteShortLink('fs-wc')
```
## Listening For File Changes

You may find yourself writing custom logic when a Botpress file has changed. For example, you could listen for changes to the QnA files to automatically launch a translation worker to translate the QnA to multiple languages.

The Botpress File System (Ghost) exposes a way to listen for file changes for that purpose. In this example, we will watch for NLU changes inside any bot.

### Example

Let's create a Hook inside the `<data_dir>/global/hooks/after_bot_mount` called `listen_nlu.js` and put the following code inside it:

```js
const listener = bp.ghost.forBot(botId).onFileChanged(file => {
  if (
    file.toLowerCase().startsWith(`data/bots/${botId}/intents/`) ||
    file.toLowerCase().startsWith(`data/bots/${botId}/entities/`)
  ) {
    bp.logger.info('NLU Data has changed: ' + file)
  }
})

setTimeout(() => {
  // Example of how to stop listening after 1m
  listener.remove()
}, 60 * 1000)
```

## Inter-bot Communication / Delegation

Sometimes your chatbot needs to "delegate" questions or tasks to other bots. We call this concept "inter-bot" communication.

The code in this example is available in the [examples](https://github.com/botpress/botpress/tree/master/examples/interbot) directory of our GitHub repository (update `workspaces.json` with the three bots if you copied them).

![Example](assets/tutorials_interbot-example.png)

### Structure

![Diagram](assets/tutorials_interbot-diagram.png)

### Step 1 – Creating the bots
You will need to create three bots: one "master" bot (the one that will delegate questions to other bots) and two "slave" bots (the ones who get asked questions by the master).

Head to the admin interface and create three bots names, `master`, `sub1`, and `sub2`, respectively, all based on the "empty bot" template.

- Leave the `master` bot empty for now.
- In the `sub1` bot, create some QnA entries related to the same domain (pick the default `global` category/context).
- In the `sub2` bot, do the same thing you did with `sub1`, but for another domain.

For example, `sub1` could answer questions about Human Resources, while `sub2` could answer IT Operations questions.

At this point, you should have three bots. Master doesn't do anything, while sub1 and sub2 can answer questions about HR and IT Operations respectively when you talk to them individually.

### Step 2 – Delegation Action (master bot)

To make the Master bot ask the questions to the slave bots, we will create an action called `delegate_to_bots` inside the `master` bot.

This action [can be found here](https://github.com/botpress/botpress/tree/master/examples/interbot/bots/master/actions/delegate_to_bots.js). Just copy and paste this file in your `<data>/bots/master/actions` directory.

Next, create a flow that makes use of that action. For the sake of simplicity, the `master` bot will only be able to delegate what you tell him to the slave bots. You could call the action at any time and even adapt the `delegate_to_bots` action to pass in more contexts.

In the `main.flow.json` flow of your master bot, recreate the structure below.

![Flow](assets/tutorials_interbot-flow.png)

The content of the text element is the following:

```
The bot {{temp.delegation.0.botId}} can help you with that question.

[Talk to {{temp.delegation.0.botId}}]({{{temp.delegation.0.botUrl}}})

By the way, {{temp.delegation.0.botId}} is telling you:
> {{{temp.delegation.0.answer}}}
```

> **Tip:** The reason we use triple mustaches (`{{{ ... }}}`) is to prevent Botpress from escaping the special characters found in the variables.

### Conclusion

That's it! You now have the basic structure in place to allow inter-bot collaboration.
