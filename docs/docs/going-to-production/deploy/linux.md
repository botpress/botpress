---
id: linux
title: Linux (Bare Metal)
---
INSTALL BOTPRESS ON LINUX THE BEST AI CHATBOT SOFTWARE GLOBALLY?:
For those who want to self host, it is a good option but the best option is using botpress.com free for learning, i just want to host myself because i am a: Must be self-hosted kinda guy. Remember servers are not cheap and installing managing updating can cost a lot if you do not know what to do.

ALL YOU NEED TO DO IS COPY AND PASTE!
copy pasting commands that have already been pasted does not matter just copy-paste, it will not break anything.
Of course, edit if the password bits, just edit those and that is it!
I have installed botpress 20 times using info below.
Ask Botpress about servers and ask for a KVM VPS server. if you have not got one yet.
latest test was on ubuntu 22
Do the following commands on Ubuntu 22 or 20(64bit): use command sudo if not the root user, should be ran as non root user but this tutorial is ran as root mostly.

OK let's start installing Botpress!
Terminal login to ssh and run these commands

sudo apt update -y

sudo apt-get update -y

mkdir botpress

cd botpress

wget https://s3.amazonaws.com/botpress-binaries/botpress-v12_30_6-linux-x64.zip

unzip botpress-v12_30_6-linux-x64.zip

./bp

That’s it! Yes, the Botpress server is now running at http://localhost:3000/ http://yourserverip:3000/

Terminal
PostgreSQL can be easily installed using the command:

sudo apt update && sudo apt install postgresql

Note: You can also install the optional package, “postgresql-contrib” but it’s not necessary. I haven’t found any benefit to installing it because all we’ll be doing is creating a PostgreSQL user and database.

Now we need to create a PostgreSQL user and database. Use the following command to switch to the PostgreSQL ‘postgres’ user account.

sudo su postgres -

To enter PostgreSQL we then type the following:

psql

The Terminal prompt should now look like this:

postgres=#

Great! In order to create our Botpress user, we use the syntax:

CREATE USER botpressuser WITH PASSWORD ‘yourpasswordhere’;

Almost there! To create the database, we use:

CREATE DATABASE botpressdb;

It’s important to note the username does not have quotations, but the password does. Personally, I prefer only including alphanumeric characters (letters and numbers) in the password so you don’t have to worry about escaping any characters. Also, make sure you put the semicolon at the end of the command. Note down these details because we need them later. To exit PostgreSQL type:

\q

and then:

exit

to return to our normal Terminal prompt.

We’ve created a PostgreSQL user and database, but Botpress doesn’t know about it. Let’s tell Botpress where it can find this information – and to use it! In order to do this we need to create an environment file in the extracted directory of Botpress (the same folder where the “bp” executable file is). Type the following:

nano .env

This creates a file called “.env” and opens it in the ‘nano’ text editor. Type the following:

DATABASE_URL=postgres://botpressuser:yourpasswordhere@localhost:5432/botpressdb

On the next line, put:

BPFS_STORAGE=database

and finally on the next line:

AUTO_MIGRATE=true

Close the file by pressing ‘CTRL + X’ and press ‘Y’ to accept the changes. That’s it! When you run

./bp

Setup SSL on Botpress

Botpress ‘Production Checklist’

If you followed the above steps yours will look different to this, but don’t fret because my installation is just configured differently!

Thanks for reading and I hope this helped you!

The featured image is from Botpress

Confirm that everything is running correctly by running the command below:

netstat -tulpn | grep LISTEN

The output should look kinda like this:

tcp 0 0 0.0.0.0:80 0.0.0.0:* LISTEN 722/nginx: master p tcp 0 0 127.0.0.53:53 0.0.0.0:* LISTEN 535/systemd-resolve tcp 0 0 0.0.0.0:22 0.0.0.0:* LISTEN 756/sshd tcp 0 0 0.0.0.0:443 0.0.0.0:* LISTEN 722/nginx: master p tcp6 0 0 :::3000 :::* LISTEN 13838/./bp

You should see a list of running processes, which should include Botpress on the port of 3000. What we should do next, as part of the initial setup, is set up NGINX to run Botpress as a proxy. Ensure you have a domain pointed to your server for the next steps.

Run the commands below to install NGINX if it is not installed already:

sudo apt-get update
sudo apt-get install nginx

Check the available configurations for your firewall with this command:

sudo ufw app list

The output will be as follows:

Output Available applications: Nginx Full Nginx HTTP Nginx HTTPS OpenSSH

Next, enable NGINX with the following command:

sudo ufw allow ‘Nginx HTTP’

Now copy paste these commands:

sudo ufw allow 22
sudo ufw enable

Then, confirm the setting by running the command below:

sudo ufw status

With it installed, we’ll need to also create a config file for our Botpress server. To do this, run the command below:

cd /etc/nginx/sites-available

Create a new file by running the following command.

sudo nano something.website

Copy the following in the file and save it.

server {

listen on port 80 (http)
server_name something.website 47.254.153.30 www.something.website;

location / {
include proxy_params;
proxy_pass http://127.0.0.1;
}

Enable the configuration with the following command.

sudo ln -s /etc/nginx/sites-available/something.website /etc/nginx/sites-enabled/

Now you should be able to access 'something.website' on your browser but it is still unsecure.

To install SSL encryption for your website, we can use Let’s Encrypt.

To get started with this, install the dependencies with the following commands:

sudo apt-get install software-properties-common
sudo add-apt-repository universe
sudo add-apt-repository ppa:certbot/certbot
sudo apt-get install certbot python-certbot-nginx
or
sudo apt-get install certbot python3-certbot-nginx

Once everything’s installed and running, run the command below:

sudo certbot --nginx

Follow the prompt to generate a certificate for your domain.

Finally, run the commands below to enable HTTPS encryption and reload NGINX.

sudo ufw allow https
sudo systemctl reload nginx

After doing that, you should be able to access 'https://something.website' on your browser. We have successfully installed and secured Botpress on a cloud KVM VPS server (Linux)

To let the bp binary run after you leave the terminal, simply launch the commands:

Installing and using PM2
Install pm2 using the below command

apt install npm

npm install pm2 -g

Start Botpress as a background process

pm2 start ‘./bp start -p’

You can also use below commands to manage Botpress process, the option names are self-explanatory

pm2 list

pm2 logs

pm2 start ‘./bp start -p’

pm2 reload ‘./bp start -p’

pm2 stop ‘./bp start -p’

pm2 delete ‘./bp start -p’

YOU MIGHT GET THIS ISSUE:

CHAT BOT URL GOES TO localhost:3000 instead of the domain url:

SOLVED:

Use the web ui admin area of botpress and go to the code editor, if you do anything wrong in that code editor you will need to reinstall. I simply added https://example.domain.com/ inside the external URL “” bit. Before you say it, yes already tried editing files from the command line over ssh/terminal,

Update Botpress easy! LInux Ubuntu cloud server vps kvm botpress update version how to:

cd botpress

wget https://s3.amazonaws.com/botpress-binaries/botpress-v12_30_6-linux-x64.zip

unzip botpress-v12_30_6-linux-x64.zip

./bp

When asked in the terminal, replace All and yes to replace files, should be fine.

NOW YOU HAVE A FULL-PRODUCTION AI CHAT BOT SERVER! FYI Botpress is probably the best opensource chat bot making software in the world 2022-2023.

Botpress is not limited like other so-called open source chat bot software.

The tutorial was updated with a working setup for chat bot url blank page issues and emulator blank page issues. Change the domain something.website or talktoai.org to whatever domain or sub domain you are using, works with both, i am using talktoai.org right now.
More info: #12375
Nginx config:
/etc/nginx/nginx.conf

events {
worker_connections 1024;
}
http {
upstream botpress-cluster {
server localhost:3000;
}
server_tokens off;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
client_max_body_size 50M;
proxy_cache_path /srv/nginx_cache levels=1:2 keys_zone=my_cache:10m max_size=10g
inactive=60m use_temp_path=off;
log_format main '$remote_addr - $remote_user [$time_local] "$request" '
'$status $body_bytes_sent "$http_referer" '
'"$http_user_agent" "$http_x_forwarded_for"';
access_log /access.log main;
error_log /error.log;
server {
server_name something.website;

Enable caching of assets by NGINX to reduce load on the server
location ~ ./assets/. {
proxy_cache my_cache;
proxy_ignore_headers Cache-Control;
proxy_hide_header Cache-Control;
proxy_hide_header Pragma;
proxy_pass http://botpress-cluster;
proxy_cache_valid any 30m;
proxy_set_header Cache-Control max-age=30;
add_header Cache-Control max-age=30;
}
location /socket.io/ {
proxy_pass http://botpress-cluster/socket.io/;
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "Upgrade";
}
location / {
proxy_pass http://botpress-cluster;
}

listen 443 ssl; # managed by Certbot
ssl_certificate /etc/letsencrypt/live/something.website/fullchain.pem; # managed by Certbot
ssl_certificate_key /etc/letsencrypt/live/something.website/privkey.pem; # managed by Certbot
include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}
server {
if ($host = talktoai.org) {
return 301 https://$host$request_uri;
} # managed by Certbot

server_name talktoai.org;
listen 80;
return 404; # managed by Certbot

}}

--------------------
