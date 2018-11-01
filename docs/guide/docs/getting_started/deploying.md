---
id: deploying
title: Deploying
---

# 🚀 Deploying our bot

Now that our bot is ready, we're ready to deploy it to Heroku.

## Heroku

We're using Heroku because it's fast, easy and free to deploy and manage your bot from there.

### Prerequisites

- If you don't already have a Heroku account, you can create one for free [here](https://signup.heroku.com).

- Install the Heroku CLI by following [these instructions](https://devcenter.heroku.com/articles/heroku-cli).

- Type `heroku login` in your terminal to log in to Heroku.

### Preparing the Docker image

To create a new bot from scratch, simply create a file named `Dockerfile` in any directory. Write this snippet in the file (and replace $VERSION with the latest one in [hub.docker.com](https://hub.docker.com/r/botpress/server/tags/))

```docker
FROM botpress/server:$VERSION
WORKDIR /botpress
CMD ["./bp"]
```

Then open a command prompt and type these commands:

```bash
# This will create a new app with a random name. Copy the name, we'll need it later
heroku create

# Creating app... done, ⬢ glacial-inlet-29943
# https://glacial-inlet-29943.herokuapp.com/ | https://git.heroku.com/glacial-inlet-29943.git
```

```bash
# Login to the container registry
heroku container:login

# This uses your Dockerfile to build the image.
heroku container:push web --app $APP_NAME

# This is the last step, your bot will be available at https://$APP_NAME.herokuapp.com/
heroku container:release web --app $APP_NAME
```

### Deploying with existing data

If you have already built a bot and want to host it on Heroku, add your `data` folder in the same folder as the `Dockerfile`. The structure should look like this:

```bash
my-new-bot
├── Dockerfile
└── data
    ├── bots
    └── global
```

Edit the `Dockerfile` so it looks like this, then deploy it with the same instructions as before:

```docker
FROM botpress/server:$VERSION
ADD . /botpress
WORKDIR /botpress
CMD ["./bp"]
```

## Configuring our app

Your bot is now live at the URL that Heroku just gave you in the last command run. When you open this URL, the bot will ask you to choose a new password.

### Using Postgres as the database

By default, Botpress uses SQLite as a database for persistence. This doesn't work well on Heroku because it has ephemeral storage, which means data will get lost every day or so. The best is to switch the database to Postgres (please make sure you are using Postgres 9.5 or higher):

```bash
# Get a free Postgres database
heroku addons:create heroku-postgresql --app $APP_NAME

# Tell Botpress to use Postgres
heroku config:set DATABASE=postgres --app $APP_NAME
```

And we're done!

## Website deployment

You can embed the bot on your website with the following snippet. Just make sure to replace `$HOST` by your Heroku URL, e.g. `https://glacial-inlet-45783.herokuapp.com`

```html
<script src="$HOST/api/ext/channel-web/inject.js"></script>
<script>window.botpressWebChat.init({ host: '$HOST', botId: '$BOTID' })</script>
```

For more information about how to use the website widget, be sure to [read through this](https://github.com/botpress/botpress/tree/master/modules/channel-web).
