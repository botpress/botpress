---
id: heroku
title: Deploying to Heroku
---
Heroku is a platform as a service (PaaS) that enables developers to build, run, and operate applications entirely in the cloud.

## Prerequisites

- If you don't already have a Heroku account, you can create one for free [here](https://signup.heroku.com).
- Install the Heroku CLI by following [these instructions](https://devcenter.heroku.com/articles/heroku-cli).
- Type `heroku login` in your terminal to log in to Heroku.

## Preparing the Docker image

To create a new bot from scratch, create a file named `Dockerfile` in any directory. Write this snippet in the file (and replace \$VERSION with the latest one in [hub.docker.com](https://hub.docker.com/r/botpress/server/tags/))

```docker
FROM botpress/server:$VERSION
WORKDIR /botpress
CMD ["/bin/bash", "-c", "./duckling & ./bp"]
```

Make sure Docker is running on your computer. Then open a command prompt and type these commands:

```bash
# This will create a new app with a random name. Copy the name because we'll need it later
heroku create

# Creating app... done, ⬢ glacial-inlet-29943
# https://glacial-inlet-29943.herokuapp.com/ | https://git.heroku.com/glacial-inlet-29943.git

# Login to the container registry
heroku container:login

# This uses your Dockerfile to build the image.
heroku container:push web --app $APP_NAME

# This is the last step, your bot will be available at https://$APP_NAME.herokuapp.com/
heroku container:release web --app $APP_NAME
```

## Deploying with existing data

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

## Using Postgres as the database

By default, Botpress uses SQLite as a database for persistence, and that doesn't work well on Heroku because it has ephemeral storage, which means data will get lost frequently. The best is to switch the database to Postgres (please make sure you are using Postgres 9.5 or higher):

```bash
# Get a free Postgres database
heroku addons:create heroku-postgresql --app $APP_NAME

# Tell Botpress to use Postgres
heroku config:set DATABASE=postgres --app $APP_NAME
```

You don't have to change anything else since Heroku will define the DATABASE_URL environment variable with the required parameters. It is also possible to find your Postgres credentials on the Heroku dashboard: Overview > Heroku Postgres > Settings > View Credentials.
