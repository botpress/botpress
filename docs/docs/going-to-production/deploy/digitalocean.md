---
id: digitalocean
title: DigitalOcean
---

--------------------

## Prerequisite

- Create a domain name dedicated to your Botpress Cluster, and generate a certificate. If you don't have a certificate, you can [follow these instructions to generate one quickly using Let's Encrypt.](https://www.digitalocean.com/community/tutorials/how-to-use-certbot-standalone-mode-to-retrieve-let-s-encrypt-ssl-certificates-on-ubuntu-1804)

## Instructions

1. [Create a new Load Balancer](https://docs.digitalocean.com/products/networking/load-balancers/how-to/create/#:~:text=Setting%20up%20a%20load%20balancer,the%20Load%20Balancers%20overview%20page.)

   - Forwarding Rules: `HTTPS 443` -> `HTTP 3000` (define the pre-requisite certificate created earlier). It is also possible to use [Passthrough](https://www.digitalocean.com/docs/networking/load-balancers/how-to/ssl-passthrough/) if you setup NGINX to redirect HTTPS requests.
   - Health Checks: You might want to set those numbers lower.
   - Sticky Sessions: `Enabled`.

2. Create a droplet (_Ubuntu 20.04_) for your [Redis instance](https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-redis-on-ubuntu-20-04)

   - Update the `bind` settings so your BP nodes can reach it.
   - Secure it with a strong password.

3. Create a droplet (_Ubuntu 20.04_) for your [Postgres instance](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-postgresql-on-ubuntu-20-04)

   - Define a password for your Postgres user.
   - Make it accessible by each BP nodes.
   - Create a new database.

4. Create a droplet (_Ubuntu Docker 18.06_) for each BP node you want to use. You will use the first one to configure our cluster's database and licensing.

5. Create a `server.yml` file and upload it on the first droplet. This file identifies which Docker image you will use and sets the required environment variables.

```yml
version: '3.5'

services:
  botpress:
    image: botpress/server:$TAG
    environment:
      - BP_CONFIG_PRO_ENABLED=true
      - CLUSTER_ENABLED=true
      - BP_CONFIG_PRO_LICENSEKEY=<license_key>
      - EXTERNAL_URL=https://yourbot.yourhostname.com
      - DATABASE_URL=postgres://user:pass@host/dbName
      - REDIS_URL=redis://host:port
    command: './bp'
    ports:
      - '3000:3000'
```

6. Upload the file `server.yml` file on each node created in step 4.

7. Run the command `docker-compose -f server.yml up -d` on each node, and your Botpress Cluster is ready!
