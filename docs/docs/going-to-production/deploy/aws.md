---
id: aws
title: Amazon Web Services
---

--------------------

Amazon Web Services provide on-demand cloud computing platforms and APIs to individuals, companies, and governments on a metered pay-as-you-go basis.
 
## Quick Start with AWS

To deploy your bot manually on Amazon Elastic Compute Cloud(EC2), create a new instance on EC2 (or use an existing one), and type the following commands:

```bash
sudo apt update
sudo apt install unzip

# Download the latest Linux binary (change $Version)
wget https://s3.amazonaws.com/botpress-binaries/botpress-$VERSION-linux-x64.zip

# Unzip the content in the current directory
unzip botpress-$VERSION-linux-x64.zip

# Launch the app
./bp
```

After following the steps above, an instance of Botpress will be available locally on port 3000.

### Setting Up NGINX

In general, NGINX is open-source software for web serving, reverse proxying, caching, load balancing, media streaming, and more. On our Botpress Server installation, NGINX allows us to reach two goals: serve as a reverse proxy and handle caching of assets. 

To get started with NGINX, install it by using the commands below:

```bash
apt install nginx
sudo mkdir /tmp/nginx_cache
```

Configure NGINX to work with Botpress by editing the file `/etc/nginx/sites-available/default`. Please use our [suggested configuration](#NGINX_Config).

### Securing Your Bot (HTTPS)

To secure your installation, we will encrypt it:

```bash
sudo apt-get install software-properties-common
sudo add-apt-repository ppa:certbot/certbot
sudo apt-get update
sudo apt-get install python-certbot-nginx
sudo certbot --nginx
```

### Monitoring and Resilience

If you want to add resilience so that Botpress automatically reboots after shut down due to an issue, we recommend using PM2.

```bash
sudo apt install npm
sudo npm install -g pm2
sudo pm2 startup
```

## Amazon Web Services Using Dokku

Dokku is like a mini heroku on-prem. Once set up on your host, it's straightforward to push deployments via a simple `git push`.

### Creating Your EC2 Instance

1. Open the EC2 Dashboard and click `Instances`. 
1. Press the `Launch Instance` button
2. At the `Choose AMI` step, we recommend using Ubuntu Server 18.04 LTS. We also support Centos 7.5, Debian 8.11, Red-hat 7.5, Ubuntu 16.04.
3. Click on the tab named `6. Configure Security Group`.
4. Add these rules:

- HTTP
- HTTPS
- Custom Port (3000)

6. Click `Review and Launch`, then connect to your newly created instance using SSH.

### Installing Dokku

We have summarized the required steps, but you can [follow the official guide](http://dokku.viewdocs.io/dokku~v0.12.13/getting-started/installation/) if you prefer.

```bash
wget https://raw.githubusercontent.com/dokku/dokku/v0.12.13/bootstrap.sh
sudo DOKKU_TAG=v0.12.13 bash bootstrap.sh
```

Once you complete your setup, open your web browser to your server's IP address and follow the instructions to configure your public key. Dokku will use the public key when you push content to deploy your bot.

Then, on your Dokku host, type this command to create a new app:

```bash
dokku apps:create botpress-server
```

:::note
We are using `botpress-server` in this guide, but it could be anything you want.
:::

Now that everything is set up correctly on your remote host, let's deploy it.

On your localhost, create an empty directory and add a file named `Dockerfile` with the following content:

```docker
FROM botpress/server:$VERSION
WORKDIR /botpress
CMD ["./bp"]
```

When you push your repository to your Dokku host, it will automatically build the image and launch it.

Type these commands:

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

### Adding a POSTGRES Database

Now, your chatbot is running on the host, but it is still using the SQLite database. Fortunately, Dokku has an open-source plugin that makes it very easy to set up the required database.

```bash
# This will download and install the Postgres plugin
sudo dokku plugin:install https://github.com/dokku/dokku-postgres.git

# Creates a new database and link it to your application
dokku postgres:create botpress-db
dokku postgres:link botpress-db botpress-server

# Tell Botpress what kind of database to use
dokku config:set botpress-server DATABASE=postgres
```

Dokku automatically sets the `DATABASE_URL` environment variable.

### Example

`channel-web.infoPage.description` --> `BP_MODULE_CHANNEL_WEB_INFOPAGE_DESCRIPTION`

:::danger Deprecated Warning 
`BP_%MODULENAME%_%config%` is deprecated and was removed in Botpress 12.
:::

## NGINX_Config

We recommend the configuration below when deploying Botpress in production.

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
