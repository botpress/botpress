---
id: version-11.4.0-cluster
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
1. Run Botpress in production so that BP Ghost use the database.

> 🌟 **Tip:** To make things easier when you setup the cluster, copy the initial `botpress.config.json` file to the other nodes before starting them. This way you won't have to manually register the license and setup postgres / redis on every node.

> ⚠️ **Important:** If you're running Botpress in dev mode, BP Ghost will use the filesystem. This means that each node will use their own filesystem instead of syncing to the database.
