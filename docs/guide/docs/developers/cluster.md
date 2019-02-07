---
id: cluster
title: Server Cluster
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
