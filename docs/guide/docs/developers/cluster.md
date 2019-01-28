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
1. Run Botpress in production so that BP Ghost use the database.

> If you're running Botpress in dev mode, BP Ghost will use the filesystem. This means that each nodes will use their own filesystem instead of syncing to the database.
