/**
 * The Dialog State Manager is in charge of keeping track of the state
 * for all conversations. This is being used internally by the [Dialog Engine]{@link DialogEngine}
 * but is also exposed publicly if you need to programmatically alter the state of some conversations.
 * @namespace DialogStateManager
 * @example
 * bp.dialogEngine.stateManager
 */

import helpers from '../database/helpers'
import { isPlainObject } from 'lodash'

module.exports = ({ db }) => {
  const isExpired = session => {
    return false // TODO Implement
  }

  const _upsertState = async (stateId, state) => {
    const knex = await db.get()
    const h = helpers(knex)

    const params = {
      tableName: 'dialog_sessions',
      stateId,
      state: JSON.stringify(state),
      now: h.date.now()
    }

    const sql = h.isLite()
      ? `
        INSERT OR REPLACE INTO :tableName: (id, state, active_on)
        VALUES (:stateId, :state, :now)
      `
      : `
        INSERT INTO :tableName: (id, state, active_on, created_on)
        VALUES (:stateId, :state, :now, :now)
        ON CONFLICT (id) DO UPDATE
          SET active_on = :now, state = :state
      `

    return knex.raw(sql, params)
  }

  const _createEmptyState = stateId => ({ _stateId: stateId })

  const _createSession = async stateId => {
    const knex = await db.get()
    const h = helpers(knex)

    const state = _createEmptyState(stateId)

    const params = {
      tableName: 'dialog_sessions',
      stateId,
      state: JSON.stringify(state),
      now: h.date.now()
    }

    const sql = h.isLite()
      ? `
        INSERT OR REPLACE INTO :tableName: (id, state, active_on, created_on)
        VALUES (:stateId, :state, :now, :now)
      `
      : `
        INSERT INTO :tableName: (id, state, active_on, created_on)
        VALUES (:stateId, :state, :now, :now)
        ON CONFLICT (id) DO UPDATE
          SET created_on = :now, active_on = :now, state = :state
      `

    await knex.raw(sql, params)

    return state
  }

  /**
   * Returns the current state of the conversation
   * @param  {String} stateId
   * @return {Object} The conversation state
   * @async
   * @memberof! DialogStateManager
   * @example
   * const state = await bp.dialogEngine.stateManager.getState(event.user.id)
   */
  const getState = async stateId => {
    const knex = await db.get()

    const session = await knex('dialog_sessions')
      .where({ id: stateId })
      .limit(1)
      .then()
      .get(0)

    if (session) {
      if (isExpired(session)) {
        // TODO trigger time out
        return _createSession(stateId)
      } else {
        return JSON.parse(session.state)
      }
    } else {
      return _createSession(stateId)
    }
  }

  /**
   * Overwrites the state of a current conversation
   * @param  {String} stateId
   * @param {Object} state The conversation state
   * @return {Object} The new state
   * @async
   * @memberof! DialogStateManager
   */
  const setState = (stateId, state) => {
    if (state != null && !isPlainObject(state)) {
      throw new Error('State must be a plain object')
    }

    return _upsertState(stateId, state != null ? state : _createEmptyState(stateId))
  }

  /**
   * Deletes the state(s) and (optionally) the associated sub-states (for e.g. ___context sub-state)
   * @param stateId The state to delete
   * @param {Array<String>} [substates] Detaults to ['context']. If this is empty it will delete no substate
   * @async
   * @memberof! DialogStateManager
   */
  const deleteState = async (stateId, substates = ['context']) => {
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
