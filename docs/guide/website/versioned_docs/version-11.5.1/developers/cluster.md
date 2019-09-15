---
id: version-11.5.1-cluster
title: Server Cluster
original_id: cluster
---

## Requirements

- Botpress Pro License
- Redis Server v5+
- PostgreSQL 10+

## Enable cluster

To enable server clustering:

1. Make sure your Botpress Pro license is registered and `pro` is enabled in your Botpress config.
1. Enable `redis` in your Botpress config.
1. Run Botpress in production so that BPFS uses database filesystem.

> 🌟 **Tip:** To make things easier when you setup the cluster, copy the initial `botpress.config.json` file to the other nodes before starting them. This way you won't have to manually register the license and setup postgres / redis on every node.

> ⚠️ **Important:** If you're running Botpress in dev mode, BPFS will use your local filesystem. This means that each node will use their own filesystem instead of syncing to the database. In other words, when you're running in cluster mode, make sure you run Botpress in production mode.

## Creating a Cluster on Digital Ocean

### Prerequisite

- Create a domain name dedicated to your Botpress Cluster, and generate a certificate. If you don't have a certificate, you can [follow these instructions to generate one quickly using Let's Encrypt.](https://www.digitalocean.com/community/tutorials/how-to-use-certbot-standalone-mode-to-retrieve-let-s-encrypt-ssl-certificates-on-ubuntu-1804)

### Instructions

1. Create a new Load Balancer

   - Forwarding Rules: `HTTPS 443` -> `HTTP 3000` (define the certificate created earlier). It is also possible to use Passthrough if you setup NGINX to redirect HTTPS requests
   - Health Checks: You might want to set those numbers lower
   - Sticky Sessions: `Enabled`

2. Create a droplet (_Ubuntu 18.04_) for your [Redis instance](https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-redis-on-ubuntu-18-04)

   - Update the `bind` settings so your BP nodes can reach it
   - Secure it with a strong password

3. Create a droplet (_Ubuntu 18.04_) for your [Postgres instance](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-postgresql-on-ubuntu-18-04)

   - Define a password for your postgres user
   - Make it accessible by each BP nodes
   - Create a new database

4. Create a droplet (_Ubuntu Docker 18.06_) for each BP node you want to use. We will use the first one to configure the database and licensing of our cluster.

5. Create a `server.yml` file and upload it on the first droplet. This file identifies which Docker image we will use and sets the required environment variables.

```yml
version: '3.5'

services:
  botpress:
    image: botpress/server:v11_5_0
    environment:
      - DATABASE=postgres
      - DATABASE_URL=postgres://user:pass@host/dbName
      - PRO_ENABLED=true
      - EXTERNAL_URL=https://yourbot.yourhostname.com
      - BP_PRODUCTION=true
    command: './bp'
    ports:
      - '3000:3000'
```

6. Start your Botpress node using Docker compose with this command: `docker-compose -f server.yml up -d`

   - Open your browser and access the Botpress Admin Panel
   - In the upper right corner, open the menu and click `Server settings`
   - Purchase or enter your license key, then close the server.
   - Edit the `server.yml` file and add your Redis configuration in the `environment` section:

```yml
- CLUSTER_ENABLED=true
- REDIS_URL=redis://host:port?password=yourpw
```

7. Upload the file `server.yml` file on each nodes created in step 4

8. Run the command `docker-compose -f server.yml up -d` on each node, and your Botpress Cluster is ready !
