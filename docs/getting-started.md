## Getting started

In this section, we will explained how easy it is to build a chatbot using Botpress and Messenger. In 9 simple steps, anyone could have an 'hello world' linked to his own Facebook Page.

### 1. Install

First thing you need to have `botpress` installed as a general dependency using `npm`. If it's done yet, you only need to install it using the following command.

```
npm install -g botpress
```

### 2. Create a new repository

Once `botpress` has been installed, in your command line tool, you need to create a new repository and move into it.

```js
mkdir hello-world-bot && cd hello-world-bot // Mac and Linux users

md hello-world-bot && cd hello-world-bot // Windows users
```

### 3. Initialization

Now, let's simply use command line interface of `botpress` to initialize your bot. To do it, you need to run the following command.

```
botpress init
```

### 4. Install modules

In your command line again, you need to install [botpress-messenger](https://github.com/botpress/botpress-messenger) module to be able to connect your bot to your Facebook Page.

```
botpress install messenger
```

### 5. Start

Once you have everything is installed, you can start your bot and see what have been installed on it.

```
botpress start
```

Go to **http://localhost:3000** and from there you can install other modules if you want to, but for this tutorial we only need `botpress-messenger` which is supposed to be already installed.

### 6. Configure Messenger connexion settings

Before starting coding it, we need to configure it then it will be linked directly to your Facebook Page. To do this step, you can follow our [5 steps](https://github.com/botpress/botpress-messenger#get-started) guide in botpress-messenger documentation.

<img src='../assets/screenshot-connexion-settings.png' height=300px />

Briefly, you only need to create a [Facebook Page](https://www.facebook.com/pages/create) if you don't already have one and create a new [Messenger Application](https://developers.facebook.com/) on Facebook Developers Interface. After that, you need to find your **App ID**, **App Secret** and **Token Access**, and copy them directly in your web messenger [module interface](http://localhost:3000/modules/botpress-messenger). Finally, you only need to activate [**ngrok**](https://ngrok.com/), **validate** and **connect** your bot.

### 7. Open in editor

Once all the setup is done, we are now ready to code your bot. First thing you need to do is to open your repository with your favorite editor (Sublime, Atom, WebStorm, Netbeans...). As you can see, some files and directories have already been created when you initialize it before to accelerate development.

```js
- botfile.js // your bot's configuration. botpress uses this
- index.js // your bot's entry point. bot logic goes here
- package.json // regular node package.json file
- LICENSE // your bot license, either AGPLv3 or Botpress License
- .gitignore // ignoring some botpress-created files by default
```

### 8. Start coding

Now, open `index.js` file and write (or copy) those lines of code. In fact, this is a simple TODO list to add directly in your code.

```js
module.exports = function(bp) {
  bp.middlewares.load()

  /* Things to do:
    [ ] Answering to hello world
    [ ] Answering to any other message
  */
}
```

**Note:** When you are coding, using TODO is a good practice to adopt because it helps to stay focus and always be able to know exactly what you need to do next...

### 9. Answering to hello world

First, we will setup a basic answer to 'hello world' from 'facebook'. You simply need to write (or copy) those lines in `index.js`.

```js
module.exports = function(bp) {
  bp.middlewares.load()

  //Catch 'hello world' from 'facebook'
  bp.hear({
    platform: 'facebook',
    type: 'message',
    text: 'hello world'
  }, (event, next) => {
    const id = event.user.id
    const last_name = event.user.last_name
    const first_name = event.user.first_name

    const text = 'Congrats ' + first_name + " " + last_name + "! Your first chatbot using Botpress is now alive."
    bp.messenger.sendText(id, text)
  })
}
```

Here, we use `hear` which is a built-in function of `bp` to listen on specific `event` conditions. In this case, as you can see it, we are listening on `platform: 'facebook'`, `type: 'message'`, and `text: 'hello world'` then when those conditions are respected, `callback` function is called and it send a custom answer to this specific `user`.

**Note**: You can restart your bot in command line by running `botpress start` and your bot will now answer to 'hello world' when you talk to him directly on Messenger.

### 10. Answering to any other message

From there, your bot now answer to 'hello world', but it doesn't answer to anything else... We will now fix that and add a default answer to other message. To do it, you only need to `hear` on different conditions.

```js
module.exports = funstion(bp) {

  // ... (Catch 'hello world form 'facebook' code)

  //Catch any 'message' from 'facebook'
  bp.hear({
    platform: 'facebook',
    type: 'message',
    text: /.+/i
  }, (event, next) => {
    bp.messenger.sendText(event.user.id, "Sorry, I only answer to 'hello world'...")
  })
}
```

As you can see, `hear` support regex expression and in our case, it's exactly what we want to. If you don't have any experience using regex, just notice that `text: /.+/i` will be respected for any text entry.
