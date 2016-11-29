## Built-in database

Botpress ships with a **SQLite 3** database and uses [knex.js](http://knexjs.org/) to expose it. Modules are encouraged to utilize the built-in database for small to medium workload.

The database is located at `${dataDir}/db.sqlite`.

### Tables

There is a single built-in table called `users`. There's also a method [`db.saveUser`](TODO) that connectors modules should use to save users to the database.

The convention is to prepend the name of your module to your tables, for example `analytics-interactions`, `messenger-config`.

### Usage

```js
bp.db.get()
.then(knex => {
    knex('users').where({ first_name: 'Sylvain' })
    .then(users => /* ... */)
})
```