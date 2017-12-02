---
layout: guide
---
All bots built with Botpress ships with a **SQLite 3** database by default. The reason is that it is easy and quick for people to test botpress in any environement and does not depend on 3rd-party database.

Botpress also officially supports (and recommends) using [**Postgres**](#postgres) (version >= 9.5), **which needs to be turned on manually**.

> **HEADS UP TO MODULE MAKERS:** Even though Botpress supports two databases, it should not affect the bot makers. Modules have the responsability of being compatible with **both SQLite AND Postgres**. No module will be accepted in the Botpress Modules Store if it has not been properly designed (and tested) to work with both databases. If you are building a module, we have [some utilities](../../advanced/database_helpers/) to abstract the underlying databases for you.

> **WARNING**: If you're deploying your bot to Heroku, you need to [Setup Postgres](#heroku) otherwise you will lose your data and configuration every day (because the file system is reset daily).

## Built-in SQLite database <a class="toc" id="toc-built-in-sqlite-database" href="#toc-built-in-sqlite-database"></a>

The database is located at `${dataDir}/db.sqlite`. It is used, enabled and created automatically by default for all bots.

### Usage <a class="toc" id="toc-usage" href="#toc-usage"></a>

```js
bp.db.get()
.then(knex => knex('users').where({ first_name: 'Sylvain' }))
.then(users => /* do stuff */)
```


 > **Note:** Botpress is using [Knex](http://knexjs.org). When you do a `bp.db.get()`, you're simply getting a ready-to-use instance of Knex.

> Examples: [select](http://knexjs.org/#Builder-select), [insert](http://knexjs.org/#Builder-insert), [update](http://knexjs.org/#Builder-update), [delete](http://knexjs.org/#Builder-del / delete)

## Key-Value-Store (KVS) <a class="toc" id="toc-key-value-store-kvs-kvs" href="#toc-key-value-store-kvs-kvs"></a> {#kvs}

For convinience, a simple Key-Value-Store is built-in Botpress. It's simply a layer on top of `bp.db`. You can rely on the KVS to store information about your users, contexts, state, etc.

The KVS is available as `bp.db.kvs`. There only two methods: `get` and `set`.

### How does it work? <a class="toc" id="toc-how-does-it-work" href="#toc-how-does-it-work"></a>

The KVS stores values as JSON, meaning that you can store anything in it and it will be serialized/undeserialized.

Essentially, you can imagine a key-value store as a big table that can store JSON:

| key | value |
|---|---|
| `'hello'` | 'world' |
| `'botpress'` | 'version 1.0' |
| `'movies'` | `{ batman: { released: 1962 } }` |
| `'users.358583'` | `{ name: 'Sylvain' }` |
| `'users.757739'` | `{ name: 'Dany' }` |

**Limitation: you can't store circular referenced structures**

### `get(key, [path])` -> Promise(value) <a class="toc" id="toc-get-key-path-promise-value" href="#toc-get-key-path-promise-value"></a>

Returns the value of a key from the store.

Optionally, you can provide a `path` argument that will only return the value inside the object.

#### Example

```js
bp.db.kvs.get(`users/id/${event.user.id}/books`)
.then(books => {
  // do something
})
```

#### Example with `path`

Let's say that there' already an object stored under the key `users/id/002485`:

> KEY(users/id/002485) == VALUE({ role: 'Admin', name: 'Perron', first_name: 'Sylvain' })

Let's say I'm only interested in getting Sylvain's role, not getting the whole object:

```js
bp.db.kvs.get('users/id/002485', 'role')
.then(role => console.log(role)) // will print 'Admin'
```

### `set(key, value, [path])` -> Promise()

This sets the **value** at **key**.

Optionally, you can provide a path (works like the `get`).

#### Example (simple)

```js
bp.db.kvs.set('bot_updated_on', new Date())
.then(() => {
  // do something else
})
```

#### Example (object)

```js
bp.db.kvs.set('users/id/002485', { name: 'Sylvain', first_name: 'Perron' })
.then(() => {
  // do something else
})
```


> **Warning**: If you provide a path, **the object will be merged**, i.e. it will not be entirely overwritten.

> For example, if you have the value `{ a: 1, b: { _b: 2 } }` and you set: `set('key', 5, 'b._b')`, then the value will become `{ a: 1, b: { _b: 5 } }`.

> However, if you don't specify any path, the entire object (value) will be replaced.

> Also notice that this method treats all-digit parts of the `path` as array indexes.

> For example, if your value is `{ a: 1 }` and you set `set('key', 5, 'b.5')`, then the value will become `{ a: 1, b: [ null, null, null, null, 5 ] }`.

> If this is not what you meant you can provide the `path` as an array of parts: `set('key', 5, [ 'b', '5' ])` will result in `{ a: 1, b: { '5': 5 } }`.

## Connecting to a Postgres 9.5+ database <a class="toc" id="toc-connecting-to-a-postgres-9-5-database-postgres" href="#toc-connecting-to-a-postgres-9-5-database-postgres"></a> {#postgres}

**Note: this is optional but highly recommended for production environement. It is also mandatory is your bot runs on Heroku due to the ephemeral nature of the disks.**

In your bot's `botfile`, there is a `postgres` configuration object that looks like so:

```js
postgres: {
  enabled: process.env.DATABASE === 'postgres',
  host: process.env.PG_HOST || '127.0.0.1',
  port: process.env.PG_PORT || 5432,
  user: process.env.PG_USER || '',
  password: process.env.PG_PASSWORD || '',
  database: process.env.PG_DB || '',
  ssl: process.env.PG_SSL || false
}
```

To enable using postgres, you should set the environement variable `DATABASE=postgres` or modify your botfile to make `postgres.enabled: true`.

The connection parameters are self-explanatory.

### Using Postgres on Heroku <a class="toc" id="toc-using-postgres-on-heroku-heroku" href="#toc-using-postgres-on-heroku-heroku"></a> {#heroku}

Heroku provides Postgres databases, however these dbs do not have static authentication details.  Thankfully, Heroku puts a connection string in the environment variables for you that stays up to date with your postgres instance.  To add your Heroku Postgres db connection, use the `connection` property in the `postgres` configuration object.

```js
postgres: {
  enabled: process.env.DATABASE === 'postgres',
  connection: process.env.DATABASE_URL,
  ssl: process.env.PG_SSL || false
}
```

Also make sure to enable SSL by setting the `PG_SSL` env variable to `true`.

### Tables <a class="toc" id="toc-tables" href="#toc-tables"></a>

There is a single built-in table called `users`. There's also a method `db.saveUser` that connectors' modules should use to save users to the database.

The convention is to prepend the name of your module to your tables, for example `analytics-interactions`, `messenger-config`.
