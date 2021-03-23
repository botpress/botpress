---
id: version-12.19.0-cluster
title: Clustering
original_id: cluster
---

## Cluster Overview

![High-Level Diagram](assets/bp-cluster.png)

## Interfaces Overview

![HTTP Interfaces](assets/http-interfaces.png)

## Requirements

- Redis Server v5+
- PostgreSQL 10+
- Load Balancer with a public address
- Botpress license registered with a public address

## Enable Redis

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
-e BPFS_STORAGE=database \
-e BP_LICENSE_KEY=<license_key> \
-e EXTERNAL_URL=<public_url> \
-e REDIS_URL=redis://host:port \
-e DATABASE_URL=postgres://login:password@host:port/database \
botpress/server:$TAG
```

Once the first node is started, use the same command to start Botpress on the other nodes.

## Enable Redis Replication

Botpress can connect to multiple Redis server for better redundancy if one of the Redis server goes down. To enable this, you must set the `REDIS_URL` variable to a list of host/port combinations.

The list must be provided as a JSON object, see the example below for the correct format. 

```bash
PRO_ENABLED=true
CLUSTER_ENABLED=true \
BPFS_STORAGE=database \
BP_LICENSE_KEY=<license_key> \
EXTERNAL_URL=<public_url> \
REDIS_URL=[{"host":"localhost","port":7004},{"host":"localhost","port":7001},{"host":"localhost","port":7002}]
DATABASE_URL=postgres://login:password@host:port/database \
./bp
```

## Advanced Redis Options

You can further configure your Redis Sentinel/Cluster using the `REDIS_OPTIONS` environment variable. Please consult the [ioredis documentation](https://github.com/luin/ioredis/blob/master/API.md) for the complete list of options.

Example :

```bash
REDIS_OPTIONS={"password":"admin123", "connectTimeout": 20000}
```
