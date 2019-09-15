---
id: version-11.0.1-hosting
title: Hosting & Environment
original_id: hosting
---

When you are ready to open your bot to the world, you should deploy it in production mode. When the bot is started in production, the ghost is enabled ([click here for more details](/docs/manage/sync-changes)) and debug logs are no longer displayed. We also highly recomment using a Postgres database instead of the embedded SQLite.

All you need to do is start Botpress with the `-p` flag, like this: `./bp -p`

Below are multiple possible ways of deploying Botpress in the cloud.

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

Dokku is like a mini heroku on-prem. Once setup on your host, it's very easy to push deployments via a simple git push.

### Creating your EC2 instance

1. Open the EC2 Dashboard and click on `Instances`. Press the `Launch Instance` button
2. At the `Choose AMI` step, we recommend using Ubuntu Server 18.04 LTS
3. Click on the tab named `6. Configure Security Group`
4. Add these rules:

- HTTP
- HTTPS
- Custom Port (3000)

5. Click `Review and Launch`, then connect to your newly created instance using SSH

### Install and configure Dokku

We have summarised the required steps, but you can [follow the official guide](http://dokku.viewdocs.io/dokku~v0.12.13/getting-started/installation/) if you prefer.

```bash
wget https://raw.githubusercontent.com/dokku/dokku/v0.12.13/bootstrap.sh
sudo DOKKU_TAG=v0.12.13 bash bootstrap.sh
```

Once setup is completed, open your web browser to your server's IP address and follow the instructions to configure your public key. This is the key that will be used when you will push your content to deploy your bot.

Then, on your Dokku host, type this command to create a new app. We are using `botpress-server` in this guide, but it could be anything you'd like.

```bash
dokku apps:create botpress-server
```

Now that everything is setup correctly on your remote host, let's deploy it.

On your local host, create an empty directory and add a file named `Dockerfile` with the following content:

```docker
FROM botpress/server:$VERSION
WORKDIR /botpress
CMD ["./bp"]
```

When you push your repository to your Dokku host, it will automatically build the image and launch it.

Type these commands :

```bash
# Initialize a new repository
git init

# Adds a new destination when pushing content on that repository.
# Your Dokku host will receive the content and will execute the Dockerfile
git remote add dokku dokku@$YOUR_EC2_IP_ADDRESS:botpress-server

# Add the files, commit and push them to the host
git add .
git commit -m first
git push dokku master
```

### Adding a POSTGRES database

Now your bot is running on the host, but it is still using the SQLite database. Fortunately, Dokku has an open-source plugin that makes it very easy to setup the required database.

```bash
# This will download and install the Postgres plugin
sudo dokku plugin:install https://github.com/dokku/dokku-postgres.git

# Creates a new database and link it to your application
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
