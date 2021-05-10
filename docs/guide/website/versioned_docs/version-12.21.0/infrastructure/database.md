---
id: version-12.21.0-database
title: Supported databases
original_id: database
---

## Introduction
By default, Botpress uses SQLite as its database. However, we recommend that you switch to PostgreSQL as early as you can in your chatbot development cycle because it is highly fault tolerant, stable, scalable and secure.

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


## Accessing databases
Two handy ways to access whichever database you choose to use are:
1. The [key-value store](https://botpress.com/reference/modules/_botpress_sdk_.kvs.html)
2. A [knex instance](http://knexjs.org/)
