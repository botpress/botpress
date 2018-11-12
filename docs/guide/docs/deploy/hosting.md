---
id: hosting
title: Hosting & Environment
---

Explain how to deploy in production:

- `-p` flag
- Postgres
- Enable HTTPS

[TODO] Digital Ocean using Docker
[TODO] On AWS using Dokku

There are multiple ways you can deploy your bot into production.

## Deploying on Heroku

### Prerequisite

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

### Using Postgres as the database

By default, Botpress uses SQLite as a database for persistence. This doesn't work well on Heroku because it has ephemeral storage, which means data will get lost every day or so. The best is to switch the database to Postgres (please make sure you are using Postgres 9.5 or higher):

```bash
# Get a free Postgres database
heroku addons:create heroku-postgresql --app $APP_NAME

# Tell Botpress to use Postgres
heroku config:set DATABASE=postgres --app $APP_NAME
```

## Deploying on AWS using Dokku

1. Create an EC2 instance on Ubuntu 18.04
2. Configure security group: add http and https. Review and launch
3. Add 3000 et 3001

### Install and configure Dokku

```bash
wget https://raw.githubusercontent.com/dokku/dokku/v0.12.13/bootstrap.sh
sudo DOKKU_TAG=v0.12.13 bash bootstrap.sh
```

Once setup is completed, open your web browser to your server's IP address an configure your public key. On your Dokku host,

```bash
dokku apps:create botpress-server
```

To deploy your app, create an empty repository and create a file named `Dockerfile` with the following content:

```docker
FROM botpress/server:$VERSION
WORKDIR /botpress
CMD ["./bp"]
```

Then, type these commands to configure

```bash
git init
git remote add dokku dokku@$YOUR_EC2_IP_ADDRESS:botpress-server
git add .
git commit -m first
git push dokku master
```

### Adding a POSTGRES database

```bash
dokku apps:create botpress-server
sudo dokku plugin:install https://github.com/dokku/dokku-postgres.git
dokku postgres:create botpress-db
dokku postgres:link botpress-server botpress-db
```

## Deploying on AWS manually

These steps shows how to deploy manually your bot on Amazon EC2. Create a new instance on EC2 (or use an existing one), and type the following commands:

```bash
sudo apt update
sudo apt install unzip

# Download the latest Linux binary
wget https://s3.amazonaws.com/botpress-binaries/botpress-ce-$VERSION-linux-x64.zip

# Unzip the content in the current directory
unzip botpress-ce-$VERSION-linux-x64.zip

# Launch the app
./bp
```

This gets you up and running locally on port 3000.

### Setting up NGINX

NGINX will allow us to reach two goals: serve as a reverse proxy and handle caching of assets.

```bash
apt install nginx
sudo mkdir /tmp/nginx_cache
```

Then, edit the file `/etc/nginx/sites-available/default` and add the following:

```bash
proxy_cache_path /tmp/nginx_cache levels=1:2 keys_zone=my_cache:10m max_size=10g
                 inactive=60m use_temp_path=off;

server_name {
  location ~ .*/assets/.* {
	  proxy_cache my_cache;
	  proxy_ignore_headers Cache-Control;
	  proxy_hide_header Cache-Control;
    proxy_hide_header Pragma;
    proxy_pass http://localhost:3000;
    proxy_cache_valid any 30m;
    proxy_set_header Cache-Control max-age=30;
    add_header Cache-Control max-age=30;
  }

  location / {
			proxy_pass http://localhost:3000;
	}
}
```

### Securing your bot (HTTPS)

To secure your installation, we will use Let's encrypt:

```bash
sudo apt-get install software-properties-common
sudo add-apt-repository ppa:certbot/certbot
sudo apt-get update
sudo apt-get install python-certbot-nginx
sudo certbot --nginx
```

### Monitoring and resilience

If you want to add resilience so your bot is restarted if there's an issue, we recommend using PM2.

```bash
sudo apt install npm
sudo npm install -g pm2
sudo pm2 startup
```
