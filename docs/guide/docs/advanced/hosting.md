---
id: hosting
title: Hosting
---

## Overview

When you are ready to open your bot to the world, you should deploy it in production mode. When the bot is started in production, the botpress file system (BPFS) is enabled [click here for more details](versions) and debug logs are no longer displayed. We also **strongly** recommend using PostgreSQL instead of the embedded SQLite.

### Offline Servers

Botpress communicates with two services in order to work properly (i.e. Duckling and a Language Server). If your Botpress installation has no internet access, you'll have to host these services on-prem. When following the different hosting methods, look for a section on on-prem hosting for further details.

#### Duckling

We use Duckling to extract system entities (e.g. time, email, currency, etc.). This service is very light and requires minimal resources.

#### Language Server

The Language Server is used to provide the language models necessary to run the NLU.

By default, the Language Server is configured to get `100` dimensions for words. If you plan to use that Language Server in production, we highly recommend setting the dimensions to `300` for a better vocabulary.

| Dimensions | RAM Usage \* | Disk Usage \* |
| ---------- | ------------ | ------------- |
| 100        | ~1.3 Gb      | ~900 Mb       |
| 300        | ~3.5 Gb      | ~3 Gb         |

\* Per language

**Download the Language Models**

1. Download this file: https://botpress-public.nyc3.digitaloceanspaces.com/embeddings/index.json
1. Download the `bpe` and `embeddings` files corresponding to your languages. For instance, for french, download the `bp.fr.bpe.model` file located under `remoteUrl` and the `bp.fr.300.bin` also located under `remoteUrl`.
1. Once the files are downloaded, place them under the `/botpress/data/embeddings/` folder.

> **Note**: `300` is the number of dimensions the model has. More dimensions means the model size is bigger. You can choose a lighter model if your server specs are limited, but keep in mind that you need to change the `--dim` parameter when you start the Language Server (e.g. `./bp lang --dim <number>`).

| Abbreviation | Language   |
| ------------ | ---------- |
| ar           | Arabic     |
| en           | English    |
| fr           | French     |
| ja           | Japanese   |
| pt           | Portuguese |
| ru           | Russian    |

## Binary

Run the following command in your command line:

```bash
EXTERNAL_URL=<public_url> \
BP_PRODUCTION=true \
DATABASE_URL=postgres://login:password@host:port/database \
./bp
```

### On-Prem Hosting with Binary

#### Duckling

When you have the duckling binary, simply edit the file `data/global/config/nlu.json` and set the parameter `ducklingURL` to where you run Duckling, for example, if it's on the same server as Botpress (and if you use the default port of `8000`), you would set:

```js
{
  ...
  "ducklingURL": "http://localhost:8000"
}
```

**Linux and Mac users**

Duckling must be compiled to run correctly on your specific system. Therefore, you will need to install the software development tools and build it from source.
Please follow the instructions on the [GitHub page of Duckling[(https://github.com/facebook/duckling)

We may provide some binaries in the future for common OS

**Windows users**

If you run Botpress on windows, there is a zip file available [here](https://s3.amazonaws.com/botpress-binaries/tools/duckling/duckling-windows.zip).
Simply double-click on run-duckling.bat (the bat file simply sets the code page of the console to UTF-8, then runs the executable). The folder `zoneinfo` includes the Olson timezones which are already available by default on other OS.

#### Language Server

The language server is embedded in Botpress and can be started by command line. Here are the steps to run it and use it with your Botpress Server:

1. Start the language server with `./bp lang`
2. In `data/global/config/nlu.json`, change `languageSources.endpoint` to `http://localhost:3100`
3. Restart Botpress and open the Languages page on the Admin Panel
4. Install the desired languages your server should support
5. Restart the language server with parameters `./bp lang --readOnly`

ReadOnly prevents anyone from adding or removing languages and can only be used to fetch embeddings. There are additional parameters that can be configured (for example, to require authentication), you can see them by typing `./bp lang help`.

## Docker

This command will run Botpress within a single container and use the remote Duckling and Language Server. You can get the latest `stable` or `nightly` versions on [DockerHub](https://hub.docker.com/r/botpress/server/tags).

> `nightly` versions are unstable and should **not** be used in production.

```
docker run -d \
--name botpress \
-p 3000:3000 \
-v botpress_data:/botpress/data \
botpress/server:$TAG
```

### On-Prem hosting with Docker

For servers without or with limited Internet access, you'll have to run the Language Server and download the language models.

1. Choose to either run one of two containers (two containers is recommended)
1. Download the language models of your choice

**Running Multiple Containers**

1. Run the Language Server.

```bash
docker run -d \
--name lang \
-p 3100:3100 \
-v botpress_data:/botpress/data \
botpress/server:$TAG \
bash -c "./bp lang --dim 300 --langDir /botpress/data/embeddings"
```

2. Run Botpress Server and Duckling within the same container. The usage of Duckling is very light here so we can justify using it in the same container as Botpress Server.

```bash
docker run -d \
--name bp \
-p 3000:3000 \
-v botpress_data:/botpress/data \
-e BP_MODULE_NLU_LANGUAGESOURCES='[{ "endpoint": "http://localhost:3100" }]' \
botpress/server:$TAG \
bash -c "./duckling & ./bp"
```

**Running a Single Container**

> ⚠️ Running multiple processes inside a single container should **never** be done in production.

This will run Duckling, the Language Server and Botpress Server within the same container. It will set some environment variables so that services talk to each other.

```bash
docker run -d \
--name bp \
-p 3000:3000 -p 3100:3100 \
-v botpress_data:/botpress/data \
-e BP_MODULE_NLU_LANGUAGESOURCES='[{ "endpoint": "http://localhost:3100" }]' \
botpress/server:$TAG \
bash -c "./duckling & ./bp lang --dim 300 --langDir /botpress/data/embeddings & ./bp"
```

## Heroku

### Prerequisite

- If you don't already have a Heroku account, you can create one for free [here](https://signup.heroku.com).
- Install the Heroku CLI by following [these instructions](https://devcenter.heroku.com/articles/heroku-cli).
- Type `heroku login` in your terminal to log in to Heroku.

### Preparing the Docker image

To create a new bot from scratch, simply create a file named `Dockerfile` in any directory. Write this snippet in the file (and replace \$VERSION with the latest one in [hub.docker.com](https://hub.docker.com/r/botpress/server/tags/))

```docker
FROM botpress/server:$VERSION
WORKDIR /botpress
CMD ["./bp"]
```

Make sure Docker is running on your computer. Then open a command prompt and type these commands:

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

You don't have to change anything else, since Heroku will define the DATABASE_URL environment variable with the required parameters. It is also possible to find your Postgres credentials on the Heroku dashboard: Overview > Heroku Postgres > Settings > View Credentials.

## AWS

These steps shows how to deploy manually your bot on Amazon EC2. Create a new instance on EC2 (or use an existing one), and type the following commands:

```bash
sudo apt update
sudo apt install unzip

# Download the latest Linux binary
wget https://s3.amazonaws.com/botpress-binaries/botpress-$VERSION-linux-x64.zip

# Unzip the content in the current directory
unzip botpress-$VERSION-linux-x64.zip

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

Then, edit the file `/etc/nginx/sites-available/default` and configure it using our suggested configuration (in a section below)

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

### Secure configuration for the NGINX server

This is the configuration we recommend deploying Botpress in production.

```bash
http {
  # Disable sending the server identification
  server_tokens off;

  # Prevent displaying Botpress in an iframe (clickjacking protection)
  add_header X-Frame-Options SAMEORIGIN;

  # Prevent browsers from detecting the mimetype if not sent by the server.
  add_header X-Content-Type-Options nosniff;

  # Force enable the XSS filter for the website, in case it was disabled manually
  add_header X-XSS-Protection "1; mode=block";

  # Configure the cache for static assets
  proxy_cache_path /sr/nginx_cache levels=1:2 keys_zone=my_cache:10m max_size=10g
                inactive=60m use_temp_path=off;

  # Set the max file size for uploads (make sure it is larger than the configured media size in botpress.config.json)
  client_max_body_size 10M;

  # Configure access
  log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

  access_log  logs/access.log  main;
  error_log  logs/error.log;

  # Redirect unsecure requests to the HTTPS endpoint
  server {
    listen 80 default;
    server_name  localhost;

    return 301 https://$server_name$request_uri;
  }

  server {
    listen 443 http2 ssl;
    server_name localhost;

    ssl_certificate      cert.pem;
    ssl_certificate_key  cert.key;

    # Force the use of secure protocols only
    ssl_prefer_server_ciphers on;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;

    # Enable session cache for added performances
    ssl_session_cache shared:SSL:50m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # Added security with HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubdomains; preload";

    # Enable caching of assets by NGINX to reduce load on the server
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

    # We need to add specific headers so the websockets can be set up through the reverse proxy
    location /socket.io/ {
      proxy_pass http://localhost:3000/socket.io/;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "Upgrade";
    }

    # All other requests should be directed to the server
    location / {
      proxy_pass http://localhost:3000;
    }
  }
}
```

## AWS using Dokku

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

# Tell Botpress what kind of database to use
dokku config:set DATABASE=postgres --app botpress-server
```

As with Heroku, the `DATABASE_URL` environment variable will already be set.

## Environment Variables

Most of these variables can be set in the configuration file `data/global/botpress.config.json`. Infrastructure configuration (like the database, cluster mode, etc) aren't available in the configuration file, since they are required before the config is loaded.

Botpress supports `.env` files, so you don't have to set them everytime you start the app. Just add the file in the same folder as the executable.

### Common

| Environment Variable | Description                                                                                                                   | Default          |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| PORT                 | Sets the port that Botpress will listen to                                                                                    | 3000             |
| BP_HOST              | The host to check for incoming connections                                                                                    | localhost        |
| EXTERNAL_URL         | This is the external URL that users type in the address bar to talk with the bot.                                             | http://HOST:PORT |
| DATABASE             | The database type to use. `postgres` or `sqlite`                                                                              | sqlite           |
| DATABASE_URL         | Full connection string to connect to the DB                                                                                   | -                |
| BP_PRODUCTION        | Sets Botpress in production mode (thus making BPFS to run on the database). This has the same effect as starting it with `-p` | false            |
| PRO_ENABLED          | Enables the pro version of Botpress, the license key will be required                                                         | false            |
| BP_LICENSE_KEY       | Your license key (can also be specified in `botpress.config.json`)                                                            | -                |
| CLUSTER_ENABLED      | Enables multi-node support using Redis                                                                                        | false            |
| REDIS_URL            | The connection string to connect to your Redis instance                                                                       | -                |

### Runtime and Modules

| Environment Variable      | Description                                                                                 | Default |
| ------------------------- | ------------------------------------------------------------------------------------------- | ------- |
| VERBOSITY_LEVEL           | Botpress will be more chatty when processing requests. This has the same effects as `-v`    |         |
| BP_DECISION_MIN_CONFIENCE | Sets the minimum threshold required for the Decision Engine to elect a suggestion           | 0,3     |
| FAST_TEXT_VERBOSITY       | Define the level of verbosity that FastText will use when training models                   | 0       |
| FAST_TEXT_CLEANUP_MS      | The model will be kept in memory until it receives no messages to process for that duration | 60000   |
| REVERSE_PROXY             | When enabled, it uses "x-forwarded-for" to fetch the user IP instead of remoteAddress       | false   |

It is also possible to use environment variables to override module configuration. The pattern is `BP_%MODULE_NAME%_%OPTION_PATH%`, all in upper cases. For example, to define the `confidenceTreshold` option of the module `nlu`, you would use `BP_NLU_CONFIDENCETRESHOLD`. You can list the available environment variales for each modules by enabling the `DEBUG=bp:configuration:modules:*` flag.

### Example

`channel-web.infoPage.description` --> `BP_MODULE_CHANNEL_WEB_INFOPAGE_DESCRIPTION`

> **Deprecation warning**: The old `BP_%MODULENAME%_%config%` is deprecated and will be removed in Botpress 12.
