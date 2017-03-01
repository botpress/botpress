# How to use the built-in Database

All bots built with Botpress ships with a **SQLite 3** database by default. The reason is that it is easy and quick for people to test botpress in any environement and does not depend on 3rd-party database.

Botpress also officially supports (and recommends) using **Postgres** (version >= 5.5), which needs to be turned on manually.

Even though Botpress supports two databases, it should not affect the bot maker. Modules have the responsability of being compatible with both SQLite AND Postgres. No module will be accepted in the Botpress Modules Store if it has not been properly designed (and tested) to work with both databases.

For bot makers, we have some utilities to abstract the underlying databases for you.

## Built-in SQLite database

The database is located at `${dataDir}/db.sqlite`. It is used, enabled and created automatically by default for all bots.

## Connecting to a Postgres 9.5+ database

**Note: this is optional but highly recommended for production environement. It is also mandatory is your bot runs on Heroku due to the ephemeral nature of the disks.**

In your bot's `botfile`, there is a `postgres` configuration object that looks like so:

```js
postgres: {
  enabled: process.env.DATABASE === 'postgres',
  host: process.env.PG_HOST || '127.0.0.1',
  port: process.env.PG_PORT || 5432,
  user: process.env.PG_USER || '',
  password: process.env.PG_PASSWORD || '',
  database: process.env.PG_DB || ''
}
```

To enable using postgres, you should set the environement variable `DATABASE=postgres` or modify your botfile to make `postgres.enabled: true`.

The connection parameters are self-explanatory.

### Using Postgres on Heroku

TODO: Contributions to this documentation are welcomed

### Tables

There is a single built-in table called `users`. There's also a method `db.saveUser` that connectors' modules should use to save users to the database.

The convention is to prepend the name of your module to your tables, for example `analytics-interactions`, `messenger-config`.

### Usage

```js
bp.db.get()
.then(knex => {
    knex('users').where({ first_name: 'Sylvain' })
    .then(users => /* ... */)
})
```

## Key-Value-Store (KVS)

For convinience, a simple Key-Value-Store is built-in Botpress. You can rely on the KVS to store information about your users, contexts, state, etc.

The KVS is available as `bp.db.kvs`. There only two methods: `get` and `set`.

### How does it work?

The KVS stores values as JSON, meaning that you can store anything in it and it will be serialized/undeserialized.

Essentially, you can imagine a key-value store as a big table that can store anything.

[key -> value]
['hello' -> 'world']
['botpress' -> 'version 0.1']
['users' -> { Sylvain: 'admin' }]

**Limitation: you can't store circular referenced structures**

### get(key, [path]) -> Promise(value)

Returns the value of a key from the store. Optionally, you can provide a `path` argument that will only return the value inside the object. 

#### Example of `path`

Let's say that there' already an object stored under the key `users`:

> KEY(users) -> VALUE({ Sylvain: { role: 'Admin' } })

Let's say I'm only interested in getting Sylvain's role, not getting the whole object:

```js
bp.db.kvs.get('users', 'Sylvain.role')
.then(role => console.log(role)) // will print 'Admin'
```

### set(key, value, [path]) -> Promise()

This sets the **value** at **key**. Optionally, you can provide a path.

If you do provide path, **the object will be merged**, i.e. it will not be entirely overwritten.

For example, if you have the value `{ a: 1, b: { _b: 2 } }` and you set: `set('key', 5, 'b._b')`, then the value will become `{ a: 1, b: { _b: 5 } }`.

## Database Helpers

There are a couple of database helpers available to bots and modules. The goal of the helpers is to help abstract the dual-database queries and operations. Before writing SQL for your bot or for your module, it is very important to understand what SQL will work on both environement and what won't.

### isLite() -> boolean

Returns true if the current database is SQLite

### createTableIfNotExists(tableName, function(table) { ... }) -> Promise

TODO: This is because Knex's built-in createTableIfNotExists doesn't work with both SQLite and Postgres. This method works on both.

### date

#### format(Date) -> Query
#### now() -> Query
#### isBefore(Column|Date date1, Column|Date date2) -> Query
#### isBetween(Column|Date date1, Column|Date date2, Column|Date date3) -> Query
#### isAfter(Column|Date date1, Column|Date date2) -> Query
#### isSameDay(Column|Date date1, Column|Date date2) -> Query

### bool

#### true() -> Query
#### false() -> Query
#### parse(databaseValue) -> Bool

Parses a value gotten from the database and returns a bool. The reason is that SQLite returns 0 and 1 instead of true/false. You should always parse bool responses from the database with this utility.