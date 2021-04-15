---
id: database
title: Supported databases
---

Botpress comes with support for SQL databases out-the-box. These can be accessed using the following methods:

1. The key-value store - This can be accessed via functions like `bp.kvs.get('key')` and `bp.kvs.set('key', 'value', 'path')`
2. A knex-instance - This allows you to work with the DB directly via `bp.db.get()`

## Introduction

By default, Botpress uses SQLite as its database. SQLite works well for local development and self-hosted installations. Still, you may run into issues when hosting using services like Heroku (which has temporary storage, meaning Heroku will erase your SQLite database at random intervals).

To address these kinds of issues and make your bot production-ready, we also support Postgres out of the box.

## How to switch from SQLite to Postgres

You should set up the database (considered as Infrastructure) before executing the Botpress software is executed.
In this case, that means that you need to configure `DATABASE_URL` environment variables.

- `DATABASE_URL=postgres://login:password@your-db-host.com:5432/your-db-name`.

If you want to use the default Postgres connection string, set it as follows:

- `DATABASE_URL=postgres`.

While using Postgres, you can configure the Connection Pools by using the `DATABASE_POOL` environment variable. For detailed options please refer to [tarn.js](https://github.com/vincit/tarn.js) for all configuration options. You must enter valid json. Example:

`DATABASE_POOL={"min": 3, "max": 10}`

Please make sure you are using Postgres 9.5 or higher.

If you don't want to type those variables each time you start Botpress, we also support `.env` files. Check out our [configuration section](../advanced/configuration) for more information about that
