import helpers from '../database/helpers'
import _ from 'lodash'

module.exports = ({ db, internals = {} }) => {
  const _internals = Object.assign(
    {
      _isExpired: session => {
        return false // TODO Implement
      }
    },
    internals
  )

  const _upsertState = async (stateId, state) => {
    let sql

    const knex = await db.get()

    const params = {
      tableName: 'dialog_sessions',
      stateId,
      state: JSON.stringify(state),
      now: helpers(knex).date.now()
    }

    if (helpers(knex).isLite()) {
      sql = `
        INSERT OR REPLACE INTO :tableName: (id, state, active_on)
        VALUES (:stateId, :state, :now)
      `
    } else {
      sql = `
        INSERT INTO :tableName: (id, state, active_on, created_on)
        VALUES (:stateId, :state, :now, :now)
        ON CONFLICT (id) DO UPDATE
          SET active_on = :now, state = :state
      `
    }

    return knex.raw(sql, params)
  }

  const _createEmptyState = stateId => {
    return { _stateId: stateId }
  }

  const _createSession = async stateId => {
    const knex = await db.get()
    const now = helpers(knex).date.now()

    const sessionData = {
      id: stateId,
      created_on: now,
      active_on: now,
      state: JSON.stringify(_createEmptyState(stateId))
    }

    await knex('dialog_sessions').insert(sessionData)
  }

  async function getState(stateId) {
    const knex = await db.get()

    const session = await knex('dialog_sessions')
      .where({ id: stateId })
      .limit(1)
      .then()
      .get(0)
      .then()

    if (session) {
      if (_internals._isExpired(session)) {
        // TODO trigger time out
        await _createSession(stateId)
        return getState(stateId)
      } else {
        return JSON.parse(session.state)
      }
    } else {
      await _createSession(stateId)
      return getState(stateId)
    }
  }

  function setState(stateId, state) {
    if (_.isNil(state)) {
      state = _createEmptyState(stateId)
    }

    if (!_.isPlainObject(state)) {
      throw new Error('State must be a plain object')
    }

    return _upsertState(stateId, state)
  }

  /**
   * Deletes the state(s) and the associated substates (for e.g. ___context state)
   * @param stateId The state to delete
   * @param substates Detaults to ['context']. If this is empty it will delete no substate
   * @returns {Promise.<void>}
   */
  async function deleteState(stateId, substates = ['context']) {
    const knex = await db.get()

    const states = [stateId, ...substates.map(x => `${stateId}___${x}`)]

    await knex('dialog_sessions')
      .whereIn('id', states)
      .del()
      .then()
  }

  return {
    getState,
    setState,
    deleteState
  }
}
