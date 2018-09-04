---
layout: guide
---

Botpress comes with support for SQL databases out-the-box and can be accessed by:

1. The key-value store - This can be accessed via functions like `bp.kvs.get('key')` and `bp.kvs.get('key', 'value', 'path')`
2. A knex-instance - This allows you to work with the DB directly via `bp.db.get()`

## Switching DB to Postgres

By default Botpress uses SQLite as it's database. This will be fine for local development and for self-hosted installations but you may run into issues when hosting using services like Heroku.

To fix this issue and to provide you with a more powerful database, Botpress also supports Postgres.
Switching to it is straightforward.

Firstly, check your botfile for the postgres-configuration section. By default it looks something like this:

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

## Other Databases

Botpress also comes with support for MongoDB or MySQL databases built in. They can be configured within your `index.js` file like this:

```js
// MongoDB
const { MongoClient } = require('mongodb')
const mongoClient = await MongoClient.connect('mongodb://localhost:27017')
process.on('SIGINT', () => mongoClient.close()) // Graceful connection shutdown on CTRL+C
bp.mongoDb = mongoClient.db('myDbName')
```


```js
// MySQL
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
