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

- Type `heroku login` in your terminal to log in to Heroku.

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

Alright, now let's deploy our app:

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

Your bot is now live at the URL that Heroku just gave you in the last command run. If you open that URL, you'll notice that you are facing a login page. The default password is `password`. You can change this password by setting the `BOTPRESS_PASSWORD` env variable:

```bash
heroku config:set BOTPRESS_PASSWORD=hello123
```

### Using Postgres as the database

By default, Botpress uses SQLite as a database for persistence. This doesn't work well on Heroku because it has ephemeral storage, which means data will get lost every day or so. The best is to switch the database to Postgres:

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


For more information about how to use the website widget, be sure to [read through this](https://github.com/botpress/botpress/tree/master/packages/channels/botpress-channel-web).

## Deploying to Self-hosted Server

Rather than Heroku you may choose to deploy to self-hosted server. This gives you more flexibility but may require deeper dev-ops knowledge. Having said that you can start with this simple deployment tutorial.

1. Set up your self-hosted machine and ssh into it. We'll use DigitalOcean's droplet running Ubuntu in our example. 
2. Add nodejs-sources: `sudo curl -sL https://deb.nodesource.com/setup_8.x | bash`
3. Install nodejs `sudo apt-get install -y nodejs build-essential`
4. Install npm and pm2 globally `npm i -g npm && npm i -g pm2`
5. Clone your app `git clone https://github.com/your/bot && cd bot`
6. Install your app's dependencies: `npm install`
7. [Setup nginx](https://doesnotscale.com/deploying-node-js-with-pm2-and-nginx/):
    * Install nginx itself `sudo add-apt-repository ppa:nginx/stable && sudo apt-get update && sudo apt-get install nginx`
    * Update your nginx configuration `sudo nano /etc/nginx/sites-available/bot`:

      ```
      server {
        server_name your.domain.com;
        listen 80;
      
        location / {
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header Host $http_host;
          proxy_set_header X-NginX-Proxy true;
          proxy_pass http://127.0.0.1:3000;
          proxy_redirect off;
        }
      }
      ```

    * Point default configuration to ours: `sudo rm /etc/nginx/sites-enabled && sudo ln -s /etc/nginx/sites-available/bot /etc/nginx/sites-enabled`
    * Start nginx service: `sudo service nginx start`
8. Start your node-server: `pm2 start npm -- start`

At this point your bot should start and be available over the internet at port 80.

We didn't cover here setting up of the Postgres and managing environment variables but there's plenty of tutorials on this topic.  Note that since your bot is just a regular node-app most of the tutorials for the latter should work for you.
