---
id: database
title: Database
---

Botpress officially supports two databases: SQLite or Postgres.

Your module can access the bot's database to create and update required tables.

## Database initialization + Table creation

Tables initialization should be done in the `onServerStarted` block of your `src/backend/index.ts` file.

index.ts

```js
import Database from './db'

let db = undefined

const onServerStarted = async (bp: SDK) => {
  db = new Database(bp)
  await db.initialize()
}
```

db.ts

```js
export default class Database {
  knex: any

  constructor(private bp: SDK) {
    this.knex = bp.database
  }

  initialize() {
    if (!this.knex) {
      throw new Error('You must initialize the database before')
    }

    this.knex.createTableIfNotExists('my_module_db', ...)
  }
}
```

## DB migration

Database migration isn't available at the moment, it should be added in a future iteration

## Knex extension

We extended Knex functionality with common features that makes development easier, by handling internally differences between different databases. When accessing `bp.database`, you have access to all the usual Knex commands, plus the following ones

### Check if using SQlite

The method `bp.database.isLite` returns true if the database is SQLite

### Table creation

Here is a simple example to create your module's table if it is missing:

Usage: `bp.database.createTableIfNotExists(table_name, data_callback)`

```js
bp.database
  .createTableIfNotExists('my_module_table', function(table) {
    table.increments('id').primary()
    table.string('type')
    table.string('text', 640)
    table.jsonb('raw_message')
    table.timestamp('ts')
  })
  .then(async () => {
    // You may chain table creation
  })
```

### Insert and retrieve

Inserts the row in the database and returns the inserted row

If you omit returnColumn or idColumn, it will use `id` as the default.

Usage: `bp.database.insertAndRetrieve(table_name, data, returnColumn?, idColumn?)`

```js
const someObject = (await bp.database.insertAndRetrieve)(
  'my_module_table',
  {
    botId: session.botId,
    important_data: bp.database.json.set(data || {}),
    created_on: bp.database.date.now()
  },
  ['botId', 'important_data', 'created_on']
)
```

### Date helper
