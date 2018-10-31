---
id: databases
title: Supported databases
---

Botpress comes with support for SQL databases out-the-box and can be accessed by:

1. The key-value store - This can be accessed via functions like `bp.kvs.get('key')` and `bp.kvs.set('key', 'value', 'path')`
2. A knex-instance - This allows you to work with the DB directly via `bp.db.get()`

## Switching DB to Postgres

By default Botpress uses SQLite as its database. This will be fine for local development and for self-hosted installations, but you may run into issues when hosting using services like Heroku.

To fix this issue and to provide you with a more powerful database, Botpress also supports Postgres.
Switching to it is straightforward.

Firstly, check your `botpress.config.json` for the postgres-configuration section. By default it looks something like this:

```js
  /*
    Postgres configuration
    If Postgres is not enabled, Botpress uses SQLite 3 (file-based database)
  */
 "database": {
    "type": "postgres",
    "host": "localhost",
    "port": 5432,
    "user": "postgres",
    "password": "",
    "database": "botpress_test",
    "ssl": false
  }
```

To enable Postgres, you can edit the configuration or pass 2 environment variables: `DATABASE=postgres` and `DATABASE_URL=postgres://login:password@your-db-host.com:5432/your-db-name`. Please make sure you are using Postgres 9.5 or higher.
