---
id: version-12.1.0-cluster
title: Clustering
original_id: cluster
---

## Requirements

- Redis Server v5+
- PostgreSQL 10+
- Load Balancer with a public address
- Botpress license registered with a public address

## Enable cluster

Start Botpress on a single node with these environment variables:

**Binary:**

```bash
PRO_ENABLED=true
CLUSTER_ENABLED=true \
BPFS_STORAGE=database \
BP_LICENSE_KEY=<license_key> \
EXTERNAL_URL=<public_url> \
REDIS_URL=redis://host:port \
DATABASE_URL=postgres://login:password@host:port/database \
./bp
```

**Docker:**

```bash
docker run -d \
--name bp \
-p 3000:3000 \
-v botpress_data:/botpress/data \
-e PRO_ENABLED=true \
-e CLUSTER_ENABLED=true \
-e BP_LICENSE_KEY=<license_key> \
-e EXTERNAL_URL=<public_url> \
-e REDIS_URL=redis://host:port \
-e DATABASE_URL=postgres://login:password@host:port/database \
botpress/server:$TAG
```

Once the first node is started, use the same command to start Botpress on the other nodes.

> `CLUSTER_ENABLED=true` will sync the filesystem to the database on startup so it can be shared across all nodes. If the filesystem is already, this step will be skipped.

## Version Control

To use version control for your Botpress data or bots, you will have to pull the changes from the database to your local filesystem, make changes in local, commit to your version control and push the changes back to the database.

> **Note:** The `BPFS_STORAGE` environment variable must be set to `database` to enable **pushing** to this node.

1. Pull the changes from the database with `bp pull`
1. Make the changes in local
1. Commit your changes to your VCS
1. Push the changes back to the database with `bp push`

### Pull

**Binary:**

```bash
./bp pull --url <url> --token <auth_token> --targetDir ./data
```

**Docker:**

```bash
docker exec -it <container> bash -c "./bp pull --url <url> --token <auth_token> --targetDir ./data"
```

### Push

**Binary:**

```bash
./bp push --url <url> --token <auth_token>
```

**Docker:**

```bash
docker exec -it <container> bash -c "./bp push --url <url> --token <auth_token>"
```

## Digital Ocean

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
    image: botpress/server:$TAG
    environment:
      - PRO_ENABLED=true
      - CLUSTER_ENABLED=true
      - BP_LICENSE_KEY=<license_key>
      - EXTERNAL_URL=https://yourbot.yourhostname.com
      - DATABASE_URL=postgres://user:pass@host/dbName
      - REDIS_URL=redis://host:port
    command: './bp'
    ports:
      - '3000:3000'
```

6. Upload the file `server.yml` file on each nodes created in step 4

7. Run the command `docker-compose -f server.yml up -d` on each node, and your Botpress Cluster is ready !
