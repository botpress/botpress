---
id: version-11.6.0-database
title: Supported databases
original_id: database
---

Botpress comes with support for SQL databases out-the-box and can be accessed by:

1. The key-value store - This can be accessed via functions like `bp.kvs.get('key')` and `bp.kvs.set('key', 'value', 'path')`
2. A knex-instance - This allows you to work with the DB directly via `bp.db.get()`

## Introduction

By default Botpress uses SQLite as its database. This will be fine for local development and for self-hosted installations, but you may run into issues when hosting using services like Heroku (which have an ephemeral storage, which means that your SQLite database will be erased at random intervals).

To address these kind of issues and make your bot production-ready, we also support Postgres out of the box.

## How to switch from SQLite to Postgres

The database configuration is considered as Infrastructure, which means that it needs to be setup before the softare is executed.
In this case, that means that you need to configure some of your Botpress configurations using environment variables.

Here are the two variables you need to change:

- `DATABASE=postgres`
- `DATABASE_URL=postgres://login:password@your-db-host.com:5432/your-db-name`.

Please make sure you are using Postgres 9.5 or higher.

If you don't want to type those variables each time you start Botpress, we also supports `.env` files. Check out our [configuration section](../manage/configuration) for more informations about that
