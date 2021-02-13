---
id: hosting
title: Hosting
---

## Overview

When you are ready to make your chatbot public, you should deploy it in production mode. Starting Botpress in production mode enables the botpress file system (BPFS) [(click here for more details)](versions) and debug logs are no longer displayed. We also **strongly** recommend using a PostgreSQL database instead of the embedded SQLite.

To enforce these changes, run the following commands in your command line program:

```bash
EXTERNAL_URL=<public_url> \
BP_PRODUCTION=true \
BPFS_STORAGE=database \
DATABASE_URL=postgres://login:password@host:port/database \
./bp
```

## Offline NLU Servers

Botpress communicates with the NLU module's two services to work properly, namely Duckling and a Language Server. If your Botpress installation has **no internet** access, you'll have to host these services yourself. Let us look at how you can achieve this.

> Self-hosting these servers is optional. Your Botpress installation will use our hosted services by default. However, these need an internet connection and, in the absence of one, should be self-hosted.

### Duckling Entity Server

The Duckling Library, which is very light and requires minimal resources, extracts information from the user's message like time, email, currency, and more. This data is referred to as system entities.

#### Installing Duckling
- **Linux and Mac**: You must compile Duckling to run correctly on your specific system. Therefore, you will need to install the software development tools and build Duckling from source.
  Please follow the instructions on the [GitHub page of Duckling](https://github.com/facebook/duckling). We may provide some binaries in the future for the common OS'.

- **Windows**: If you run Botpress on windows, there is a zip file available [here](https://s3.amazonaws.com/botpress-binaries/tools/duckling/duckling-windows.zip).
  Double-click on run-duckling.bat (the bat file sets the console's code page to UTF-8, then runs the executable). The folder `zoneinfo` includes the Olson timezones, which are already available by default on other OS.

#### How To Use
When you have the duckling binary, edit the file `data/global/config/nlu.json` and set the parameter `ducklingURL` to where you run Duckling, for example, if it's on the same server as Botpress (and if you use the default port of `8000`), you will set:
```js
{
  ...
  "ducklingURL": "http://localhost:8000"
}
```

### Language Server

The Language Server is used to provide the language models necessary to run the NLU. Language models allow your bot to learn text representations and text classifiers.

By default, the Language Server is configured to get `100` dimensions for words. If you plan to use that Language Server in production, we highly recommend setting the dimensions to `300` for a better vocabulary.

| Dimensions | RAM Usage \* | Disk Usage \* |
| ---------- | ------------ | ------------- |
| 100        | ~1.3 Gb      | ~900 Mb       |
| 300        | ~3.5 Gb      | ~3 Gb         |

\* Per language

#### Installing Language Server
1. Open this metadata file: https://botpress-public.nyc3.digitaloceanspaces.com/embeddings/index.json
2. Download the `bpe` and `embeddings` files corresponding to your languages. For instance, for french, download the `bp.fr.bpe.model` file located under `remoteUrl` and the `bp.fr.300.bin` also located under `remoteUrl`.
3. Once you download the files, place them somewhere on your server file system and take note of the path.
4. Add the `--offline` and the `--dim <number>` arguments to your command when starting the language server. i.e. `./bp lang --offline --dim <number> --langDir <some_path>`. Ensure that the dimension argument matches the dimensions of the models you have downloaded, e.g., `bp.en.300.bin`.

> **Note**: `300` is the number of dimensions the model has. More dimensions mean the model size is bigger. You can choose a lighter model if your server specs are limited, but keep in mind that you need to change the `--dim` parameter when you start the Language Server (e.g. `./bp lang --dim <number>`).

| Abbreviation | Language   |
| ------------ | ---------- |
| ar           | Arabic     |
| en           | English    |
| fr           | French     |
| ja           | Japanese   |
| pt           | Portuguese |
| ru           | Russian    |
| de           | German     |
| es           | Spanish    |
| he           | Hebrew     |
| it           | Italian    |
| nl           | Dutch      |
| pl           | Polish     |

#### Using your Language Server

The language server embedded in Botpress is started using a command-line program. Here are the steps to run it and use it with your Botpress Server:

1. Start the language server with `./bp lang`
2. In `data/global/config/nlu.json`, change `languageSources.endpoint` to `http://localhost:3100`
3. Restart Botpress and open the Languages page on the Admin Panel
4. Install the desired languages your server should support
5. Restart the language server with parameters `./bp lang --readOnly`

ReadOnly prevents anyone from adding or removing languages and can only be used to fetch embeddings. There are additional parameters that can be configured (for example, to require authentication); you can see them by typing `./bp lang help`.

A common configuration of the server is `./bp lang --offline --dim 300 --langDir C:/<path_to_fasttext-library>`

```
Options:
      --version           Show version number                          [boolean]
  -v, --verbose           verbosity level                                [count]
      --help              Show help                                    [boolean]
      --port              The port to listen to                  [default: 3100]
      --host              Binds the language server to a specific hostname [default: "localhost"]
      --langDir           Directory where language embeddings will be saved
      --authToken         When enabled, this token is required for clients to query your language server
      --adminToken        This token is required to access the server as admin and manage language.
      --limit             Maximum number of requests per IP per "limitWindow" interval (0 means unlimited)              [default: 0]
      --limitWindow       Time window on which the limit is applied (use standard notation, ex: 25m or 1h)      [default: "1h"]
      --metadataLocation  URL of metadata file which lists available languages [default: "https://nyc3.digitaloceanspaces.com/botpress-public/embeddings/index.json"]
      --offline           Whether or not the language server has internet access   [boolean] [default: false]
      --dim               Number of language dimensions provided (25, 100 or 300 at the moment)                          [default: 100]
      --domain            Name of the domain where those embeddings were trained on.                                    [default: "bp"]
```

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

Choose to either run one of two containers (two containers are recommended).

### Running a Single Container
Doing this will run Duckling, the Language Server, and Botpress Server within the same container. It will set some environment variables so that services talk to each other.

> ⚠️ You should **never** run multiple processes inside a single container in production.

```bash
docker run -d \
--name bp \
-p 3000:3000 -p 3100:3100 \
-v botpress_data:/botpress/data \
-e BP_MODULE_NLU_LANGUAGESOURCES='[{ "endpoint": "http://localhost:3100" }]' \
botpress/server:$TAG \
bash -c "./duckling & ./bp lang --langDir /botpress/data/embeddings & ./bp"
```

**Offline Server**: Follow the Offline Server [instructions](#offline-nlu-servers) if you're running a server without Internet access.

### Running Multiple Containers

1. Run the Language Server.

```bash
docker run -d \
--name lang \
-p 3100:3100 \
-v botpress_data:/botpress/data \
botpress/server:$TAG \
bash -c "./bp lang --langDir /botpress/data/embeddings"
```

2. Run Botpress Server and Duckling within the same container. Duckling's usage is very light here, so we can justify using it in the same container as Botpress Server.

```bash
docker run -d \
--name bp \
-p 3000:3000 \
-v botpress_data:/botpress/data \
-e BP_MODULE_NLU_LANGUAGESOURCES='[{ "endpoint": "http://localhost:3100" }]' \
botpress/server:$TAG \
bash -c "./duckling & ./bp"
```

**Offline Server**: Follow the Offline Server [instructions](#offline-nlu-servers) if you're running a server without Internet access.

## Heroku

### Prerequisite

- If you don't already have a Heroku account, you can create one for free [here](https://signup.heroku.com).
- Install the Heroku CLI by following [these instructions](https://devcenter.heroku.com/articles/heroku-cli).
- Type `heroku login` in your terminal to log in to Heroku.

### Preparing the Docker image

To create a new bot from scratch, create a file named `Dockerfile` in any directory. Write this snippet in the file (and replace \$VERSION with the latest one in [hub.docker.com](https://hub.docker.com/r/botpress/server/tags/))

```docker
FROM botpress/server:$VERSION
WORKDIR /botpress
CMD ["/bin/bash", "-c", "./duckling & ./bp"]
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

Make sure that `Dockerfile` has no extension. If you save it as `Dockerfile.txt`, for example, it will not be loaded.

Edit the `Dockerfile` so it looks like this, then deploy it with the same instructions as before:

```docker
FROM botpress/server:$VERSION
ADD . /botpress
WORKDIR /botpress
CMD ["./bp"]
```

### Using Postgres as the database
By default, Botpress uses SQLite as a database for persistence, which doesn't work well on Heroku because it has temporary storage, which means data will get lost every day or two. The best is to switch the database to Postgres (please make sure you are using Postgres 9.5 or higher):

```bash
# Get a free Postgres database
heroku addons:create heroku-postgresql --app $APP_NAME

# Tell Botpress to use Postgres
heroku config:set DATABASE=postgres --app $APP_NAME
```

You don't have to change anything else since Heroku will define the DATABASE_URL environment variable with the required parameters. It is also possible to find your Postgres credentials on the Heroku dashboard: Overview > Heroku Postgres > Settings > View Credentials.

## AWS

The steps below show how to deploy your bot on Amazon EC2 manually. Create a new instance on EC2 (or use an existing one), and type the following commands:

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

The instructions above get you up and running locally on port 3000.

### Setting up NGINX
NGINX will allow us to reach two goals: serve as a reverse proxy and handle caching of assets.

```bash
apt install nginx
sudo mkdir /tmp/nginx_cache
```

Then, edit the file `/etc/nginx/sites-available/default` and configure it using our suggested configuration.

### Secure configuration for the NGINX server

We recommend deploying Botpress in production using this configuration.

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

If you want to add resilience, so your bot is restarted, if there's an issue, we recommend using PM2.

```bash
sudo apt install npm
sudo npm install -g pm2
sudo pm2 startup
```

## AWS using Dokku

Dokku is like a mini Heroku on-prem. Once set up on your host, it's effortless to push deployments via a simple git push.

### Creating your EC2 instance

1. Open the EC2 Dashboard and click on `Instances`. Press the `Launch Instance` button
2. At the `Choose AMI` step, we recommend using Ubuntu Server 18.04 LTS; we also support Centos 7.5, Debian 8.11, Red-hat 7.5, Ubuntu 16.04
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

Once you complete setup, open your web browser to your server's IP address and follow the instructions to configure your public key. This key is used when you will push your content to deploy your bot.

Then, on your Dokku host, type this command to create a new app. We are using `botpress-server` in this guide, but it could be anything you'd like.

```bash
dokku apps:create botpress-server
```

Now that everything is set up correctly on your remote host let's deploy it.

On your localhost, create an empty directory and add a file named `Dockerfile` with the following content:

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

Now your bot is running on the host, but it is still using the SQLite database. Fortunately, Dokku has an open-source plugin that makes it very easy to set up the required database.

```bash
# This will download and install the Postgres plugin
sudo dokku plugin:install https://github.com/dokku/dokku-postgres.git

# Creates a new database and link it to your application
dokku postgres:create botpress-db
dokku postgres:link botpress-db botpress-server

# Tell Botpress what kind of database to use
dokku config:set botpress-server DATABASE=postgres
```

As with Heroku, the `DATABASE_URL` environment variable is already set.

### Example

`channel-web.infoPage.description` --> `BP_MODULE_CHANNEL_WEB_INFOPAGE_DESCRIPTION`

> **Deprecation warning**: The old `BP_%MODULENAME%_%config%` is deprecated in Botpress 12.
