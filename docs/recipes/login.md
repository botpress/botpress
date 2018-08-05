---
layout: guide
---

The easiest way to implement login is to have a list of users either in your database or in a static json-file. You will need to store their username and a **hash** of their password. 

Within the bot you will need to do the following:

First you need to send the user a form to ask for their login-data. Below is an example of a webchat renderer:

```js
'#login-form': data => [{ typing: true, type: 'login_prompt' }],
```

Second - make sure that your `bp.hear` listens to `login_prompt` event types:

```js
bp.hear({ type: /login_prompt|text|message|quick_reply/i }, (event, next) => { /* ... */ })
```

Third and finally you need an action that will compare the provided login-data with the stored records (in JSON or the DB) and set a state variable indicating the login status.

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

Note that in the example above we are relying on [`bcrypt`](https://www.npmjs.com/package/bcrypt) package to create password hash so it needs to be installed and imported before using.

# Botpress-cloud Authentication

To save your users from remembering yet another password they can be authenticated through Botpress Cloud (or other OAuth service). 

To implement this you will need to:

1. Redirect the user to the OAuth login page to authenticate the user
2. Handle the callback request that the service will make to your bot
3. Save the user's data in state and indicate their login status

The following example is for Botpress Cloud and assumes you have paired your bot with the service 

<!--Link here to the botpress cloud docs for setup-->

## 1. Redirecting user to the third-party login page

To redirect the user to the login page you will need an action that builds and passes your URL to the renderer

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

The action refers renderer that shows a single carousel card:

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

## 2. Handling callback from third-party login service

After the user successfully logs in with the service provider (Botpress Cloud in this case) you need to handle the callback request on the URL provided by the actions `path` variable:

```js
const authRouter = bp.getRouter('botpress-auth', { auth: false })
authRouter.get('/pair/:userId', async (req, res) => {
  const user = await bp.security.getUserIdentity(req.query.identity)

  // We are passing this to the sendIncoming middleware so that this can be processed as a message
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

To have this message handled by the dialog engine, you have to make sure that the bot is listening for this type of event:

```js
  bp.hear({ type: /message|text|login_callback/i }, async (event, next) =>
    bp.dialogEngine
      .processMessage(event.sessionId || event.user.id, event)
      .then()
  )
```

## 3. Storing user login details

Again you will need to store the users details, in this case just the email address as the third-party will have validated the password, in your database or a static JSON file:

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
