# Database Helpers

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
