---
layout: guide
---

Botpress comes with SQL-database built-in and you can use it in your scenarios:

1. You can use key-value store via functions like `bp.kvs.get('key')` and `bp.kvs.get('key', 'value', 'path')`
2. You can get knex-instance to work with system DB directly via `bp.db.get()`

## Switching DB to Postgres

By default Botpress uses SQLite as a database. It may be fine for local development and for self-hosted installations but you may run into issues with hostings like Heroku.

To fix this issues and to provide botpress-developers with more powerful database, botpress also supports Postgres.
Switching to it is pretty straightforward. First thing to do you can check your botfile for postgres-configuration. By default it looks something like this:

```js
  /*
    Postgres configuration
    If Postgres is not enabled, Botpress uses SQLite 3 (file-based database)
  */
  postgres: {
    enabled: process.env.DATABASE === 'postgres',
    connection: process.env.DATABASE_URL,
    host: process.env.PG_HOST || '127.0.0.1',
    port: process.env.PG_PORT || 5432,
    user: process.env.PG_USER || '',
    password: process.env.PG_PASSWORD || '',
    database: process.env.PG_DB || '',
    ssl: process.env.PG_SSL || false
  }
```

So to enable Postgres you just need to pass 2 environment variables: `DATABASE=postgres` and `DATABASE_URL=postgres://login:password@your-db-host.com:5432/your-db-name`. Please make sure you are using Postgres 9.5 or higher.

## 3-rd Party Databases

It may appear that you need to connect to 3rd party DB and work with it within flow of your bot.
Let's assume we need to connect to 3rd-party MongoDB and MySQL databases. This can be done within your `index.js` file like this:

```js
const { MongoClient } = require('mongodb')
const mongoClient = await MongoClient.connect('mongodb://localhost:27017')
process.on('SIGINT', () => mongoClient.close()) // Graceful connection shutdown on CTRL+C
bp.mongoDb = mongoClient.db('myDbName')

bp.mySqlDB = require('knex')({
  client: 'mysql',
  connection: {
    host: '127.0.0.1',
    user: 'your_database_user',
    password: 'your_database_password',
    database: 'myapp_test'
  }
})
process.on('SIGINT', () => bp.mySqlDB.destroy())
```
