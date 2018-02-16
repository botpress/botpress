---
layout: guide
---

# Storage Mechanisms

Even though Botpress has a built-in database, it aims at abstracting most of the storage for you to simplify data management. Botpress does that by providing high-level APIs.

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

If you want to store things about your users and you want that information to be persisted across multiple conversations, we suggest you use [User Tags](../advanced/tags).

```js
storeAge: async (state, event) => {
  const userId = event.user.id
  
  // Set the age
  await event.bp.users.tag(userId, 'age', 12) // Value can be anything, it will get serialized

  // Get the age back
  const age = await event.bp.users.getTag(userId, 'age')

  // Delete the age
  await event.bp.users.untag(userId, 'age')

  return
},
```

### Alternatives

If you prefer to store these information somewhere else, you can use the `userId` as the key for external storage.

```js
storeLargePayload: (state, event) => {
  const userId = event.user.id
  // Store something huge somewhere using the userId as key
  return
},
```

## Global storage

If you want to store things globally, you can use the built-in [Key-Value-Store (KVS)](../advanced/kvs).

```js
storeGlobal: async (state, event) => {
  const kvs = event.bp.db.kvs

  // Set global variable
  await kvs.set('winner', { name: 'Joe' })

  // Get global variable
  const winner = await kvs.get('winner')

  return
},
```

## Full database

If nothing of the above works for you, you might want to consider using the built-in database (SQLite or Postgres). This is the most flexible option but obviously comes with more work on your end.

Botpress uses the great [**knex**](http://knexjs.org) library to abstract the database layer. You may get an instance of `knex` with the following code:

```js
// If you have access to `bp` directly
const knex = await bp.db.get()

// Instead if you have an event:
const knex = await event.bp.db.get()
```

---

## Leaderboard

### Storing user-specific data (Tags)

### Storing general data (KVS)
