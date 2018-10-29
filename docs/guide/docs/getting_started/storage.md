---
id: storage
title: Storage
---

# 📚 Storage Mechanisms

Even though Botpress has a built-in database, it aims to abtract most of the storage for you to simplify data management. Botpress does that by providing high-level APIs.

## Per-conversation storage

In the context of a conversation, data should in most cases be stored in the **state** itself (see [actions](./actions)).

### Alternatives

If for some reason you don't want to store the data in the state (perhaps it is too large or too sensitive), we recommend you retrieve the `stateId` from the state. You can then use that `stateId` as the key for your external storage mechanism.

```js
storeLargePayload: state => {
  const stateId = state._stateId
  // Store something huge somewhere using the stateId as key
  return
},
```

## Per-user storage

If you want to store things about your users and you want that information to be persisted across multiple conversations, we suggest you use `User Variable`.

```js
storeAge: async (state, event) => {
  const userId = event.target
  const key = bp.kvs.getUserStorageKey(userId, 'age')

  // Set the age
  // Value can be anything, it will get serialized
  await bp.kvs.setStorageWithExpiry(event.botId, key, 12, 'never')

  // Get the age back
  const age = await bp.kvs.getStorageWithExpiry(event.botId, key)

  // Delete the age
   await bp.kvs.removeStorageKeysStartingWith(key)

  return
},
```

### Alternatives

If you prefer to store this information somewhere else, you can use the `userId` as the key for external storage.

```js
storeLargePayload: (state, event) => {
  const userId = event.target
  // Store something huge somewhere using the userId as key
  return
},
```

## Global storage

If you want to store things globally, you can use the built-in [Key-Value-Store (KVS)](../recipes/kvs).

```js
storeGlobal: async (state, event) => {
  const kvs = event.bp.kvs

  // Set global variable
  await kvs.set('winner', { name: 'Joe' })


  // Get global variable
  const winner = await kvs.get('winner')

  return
},
```

## Full database

If none of the above works for you, you might want to consider using a built-in database (SQLite or Postgres). This is the most flexible option but obviously comes with more work on your end, as you'll have to manually create and maintain tables, rows and write SQL queries.

Botpress uses the great [**knex**](http://knexjs.org) library to abstract the database layer. You may get an instance of `knex` with the following code:

```js
// If you have access to `bp` directly
const knex = await bp.database.get()

// Instead if you have an event:
const knex = await event.bp.database.get()
```
