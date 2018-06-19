---
layout: guide
---

The easiest way to implement login is to have a list of users either in your database or in static json-file along with hashes of their passwords. This way you would need to perform a few steps.

First we need a form to ask user for login-data. A webchat renderer for it can look something like this:

```js
'#login-form': data => [{ typing: true, type: 'login_prompt' }],
```

Second - make sure that your `bp.hear` listens to `login_prompt` event types like this:

```js
bp.hear({ type: /login_prompt|text|message|quick_reply/i }, (event, next) => { /* ... */ })
```

And finally you need an action that would compare login-data with records in JSON or in DB and set state variable indicating login status.

```js
// Stub replacing DB or static file
const users = [
  {
    username: 'testuser',
    password: '$2b$10$xAwE6hDEZnu6wd8gMMOVf.OERQXLp96Ew/CVO4VM.RkEmVvzKdpya' // Hashed 'myPlaintextPassword'
  },
  /* ... */
]

async function login(state, { raw: { data } }) {
  const user = users.find(user => user.username === data.username)
  const isLoginOk = user && await bcrypt.compare(data.password, user.password)
  return { ...state, username: isLoginOk ? user.username : null }
}
```

Note, that in the example above we are relying on `bcrypt` to create password hash so it needs to be installed and imported before using.

# Botpress-cloud Authentication

If you don't want your user to be forced to enter password, you can implement authentication through Botpress Cloud (or other services). So given you are using BP-Cloud and have your bot paired with it, you could:

1. Redirect user to their login page and let them authenticate user
2. Handle callback request that they'll make to our bot
3. Save user's data in state to indicate his login status

## Redirecting user to third-party login page

So first we'd need to have some action that trigger login form to be displayed to user:

```js
renderLogin: async (state, event) => {
  const { botId, endpoint } = require('../bp-cloud.json') // Assuming you have paired your bot with Botpress Cloud
  const { env } = event.bp.botfile // env key should be present in botfile
  const path = `/api/botpress-auth/pair/${event.user.id}`
  await event.reply('#login-gate', {
    url: `${endpoint}/login?action=callback&botId=${botId}&direct=1&env=${env}&callbackPath=${path}`
  })
},
```

If you are an Enterprise client, you may use your custom login screen by providing the `connection=<YOUR ENTERPRISE ID HERE>` setting in the url params.

Our action refers renderer that can look like this:

```js
'#login-gate': data => {
  return [
    {
      on: 'webchat',
      type: 'carousel',
      typing: '1s',
      text: 'You have to login before we can continue',
      settings: {
        responsive: [{ breakpoint: 400, settings: { slidesToShow: 1 } }]
      },
      elements: [
        {
          title: 'Restricted Access',
          subtitle: 'You have to login before we can continue',
          buttons: [{ url: data.url, title: 'Login' }]
        }
      ]
    }
  ]
},
```

## Handling callback from third-party login service

Given login was successful we should handle callback third-party service (BP Cloud in our case) performs.
So we need to define route for it:

```js
const authRouter = bp.getRouter('botpress-auth', { auth: false })
authRouter.get('/pair/:userId', async (req, res) => {
  const user = await bp.security.getUserIdentity(req.query.identity)

  // We are passing this to incoming middleware so that this can be processed as a message
  bp.middlewares.sendIncoming({
    type: 'login_callback',
    text: 'I am ' + user.email,
    platform: 'webchat',
    raw: user,
    user: { id: req.params.userId }
  })

  res.sendStatus(200)
})
```

To have this event type handled by dialog engine you have to make sure we are listening to this type of event:

```js
  bp.hear({ type: /message|text|login_callback/i }, async (event, next) =>
    bp.dialogEngine
      .processMessage(event.sessionId || event.user.id, event)
      .then()
  )
```

## Storing user login details

And here we are back to implementing action handling user's login. It is pretty much the same as in the first example except for checking password (we assume that it was checked by third-party service).

```js
// Stub replacing DB or static file
const users = [
  { email: 'testuser@domain.com' },
  /* ... */
]

async function loginFromCloud(state, { raw: { email } }) {
  const user = users.find(user => user.email === email)
  return { ...state, userEmail: user ? user.email : null }
}
```
