module.exports = {
  up: async knex => {
    if (knex.client.config.client !== 'pg') {
      return
    }
    knex.raw("SELECT pg_catalog.setval(pg_get_serial_sequence('hitl_messages', 'id'), MAX(id)) FROM hitl_messages;")
  },
  down: async knex => null
}
