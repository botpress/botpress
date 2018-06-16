---
layout: guide
---

Botpress comes with SQL-database built-in and you can use it in your scenarios:

1. You can use key-value store via functions like `bp.kvs.get('key')` and `bp.kvs.get('key', 'value', 'path')`
2. You can get knex-instance to work with system DB directly via `bp.db.get()`

But it may appear that you need to connect to 3rd party DB and work with it within flow of your bot.
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
