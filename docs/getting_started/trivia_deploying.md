---
layout: guide
---

# 🚀 Deploying our bot

Now that our bot is ready, we're ready to deploy it to Heroku.

## Heroku

We're using Heroku because it's fast, easy and free to deploy and manage your bot from there.

### Prerequisites

- If you don't already have a Heroku account, you can create one for free [here](https://signup.heroku.com).

- Install the Heroku CLI by following [these instructions](https://devcenter.heroku.com/articles/heroku-cli).

- Type `heroku login` in your terminal to login to heroku

### Git

Let's init a git repo in our bot directory:

```bash
git init

git add .

git commit -m "First commit"
```

Then let's create a Heroku App:

```bash
heroku create

# Creating app... done, ⬢ glacial-inlet-29943
# https://glacial-inlet-29943.herokuapp.com/ | https://git.heroku.com/glacial-inlet-29943.git
```

Alright, now let's actually deploy our app:

```bash
git push heroku master
```

And you're done! You should see something like:

```bash
remote:        https://glacial-inlet-29943.herokuapp.com/ deployed to Heroku
remote:
remote: Verifying deploy... done.
To https://git.heroku.com/glacial-inlet-29943.git
 * [new branch]      master -> master
```

For more information about how to setup Heroku, [read this](https://devcenter.heroku.com/articles/git).

## Configuring our app

Your bot is now live at the URL that Heroku just gave you in the last command run. If you open that URL you'll notice that you are facing a login page. The default password is `password`. You can change this password by setting the `BOTPRESS_PASSWORD` env variable:

```bash
heroku config:set BOTPRESS_PASSWORD=hello123
```

### Using Postgres as the database

By default Botpress uses SQLite as a database for persistence. This doesn't work well on Heroku because it has ephemeral storage, which means data will get lost every day or so. The best is to switch the database to Postgres:

```bash
# Get a free Postgres database
heroku addons:create heroku-postgresql

# Tell Botpress to use Postgres
heroku config:set DATABASE=postgres
```

And we're done!

## Website deployment

You can embed the bot on your website with the following snippet. Just make sure to replace `<<HOST>>` by your Heroku URL, e.g. `https://glacial-inlet-45783.herokuapp.com`

```html
<script src="<<HOST>>/api/botpress-platform-webchat/inject.js"></script>
<script>window.botpressWebChat.init({ host: '<<HOST>>' })</script>
```


For more information about how to use the website widget, be sure to [read through this](https://github.com/botpress/botpress-platform-webchat).