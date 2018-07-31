import Joi from 'joi'

import baseAction, { Annotate } from '../base'
import { getConversationStorageKey, getUserStorageKey, getGlobalStorageKey } from '../../common'
import { setStorageWithExpiry, getStorageWithExpiry, removeStorageKeysStartingWith } from './driver'

export const setUserVariable = baseAction(
  async (bp, state, event, { name, value, expiry }) => {
    const userId = event.user.id
    const key = getUserStorageKey(userId, name)
    await setStorageWithExpiry(bp, key, value, expiry)
  },
  Joi.object().keys({
    ...Annotate('Storage', 'Set user variable', "Stores a variable under this user's storage, with optional expiry"),
    name: Joi.string()
      .required()
      .regex(/^[a-z0-9_$]+$/i, 'token with allowed $')
      .description('The name of the variable.'),
    value: Joi.any()
      .optional()
      .description('Set the value of the variable.'),
    expiry: Joi.string()
      .optional()
      .default('never')
      .description('Set the expiry of the data, can be "never" or a short string like "6 hours".')
  })
)

export const getUserVariable = baseAction(
  async (bp, state, event, { name, output }) => {
    const userId = event.user.id
    const key = getUserStorageKey(userId, name)
    const result = await getStorageWithExpiry(bp, key)
    return { ...state, [output]: result }
  },
  Joi.object().keys({
    ...Annotate(
      'Storage',
      'Get user variable',
      "Retrieves a variable for this user, if that data hasn't expired. (out to `$r`)"
    ),
    name: Joi.string()
      .required()
      .regex(/^[a-z0-9_$]+$/i, 'token with allowed $')
      .description('The name of the variable.'),
    output: Joi.string()
      .required()
      .default('$r')
      .regex(/^[a-z0-9_$]+$/i, 'token with allowed $')
      .description('The state variable to output to')
  })
)

export const resetUserVariable = baseAction(
  async (bp, state, event, { name }) => {
    const userId = event.user.id
    const key = getUserStorageKey(userId, name)
    await removeStorageKeysStartingWith(bp, key)
  },
  Joi.object().keys({
    ...Annotate('Storage', 'Reset user variable', 'Deletes a user variable'),
    name: Joi.string()
      .required()
      .regex(/^[a-z0-9_$]+$/i, 'token with allowed $')
      .description('The name of the variable.')
  })
)

export const setConversationVariable = baseAction(
  async (bp, state, event, { name, value, expiry }) => {
    const stateId = (state && state._stateId) || event.stateId || event.user.id
    const key = getConversationStorageKey(stateId, name)
    await setStorageWithExpiry(bp, key, value, expiry)
  },
  Joi.object().keys({
    ...Annotate(
      'Storage',
      'Set conversation variable',
      "Stores a variable under this conversation's storage, with optional expiry"
    ),
    name: Joi.string()
      .required()
      .regex(/^[a-z0-9_$]+$/i, 'token with allowed $')
      .description('The name of the variable.'),
    value: Joi.any()
      .optional()
      .description('Set the value of the variable.'),
    expiry: Joi.string()
      .optional()
      .default('never')
      .description('Set the expiry of the data, can be "never" or a short string like "6 hours".')
  })
)

export const getConversationVariable = baseAction(
  async (bp, state, event, { name, output }) => {
    const stateId = (state && state._stateId) || event.stateId || event.user.id
    const key = getConversationStorageKey(stateId, name)
    const result = await getStorageWithExpiry(bp, key)
    return { ...state, [output]: result }
  },
  Joi.object().keys({
    ...Annotate(
      'Storage',
      'Get conversation variable',
      "Retrieves a variable for this conversation, if that data hasn't expired. (out to `$r`)"
    ),
    name: Joi.string()
      .required()
      .regex(/^[a-z0-9_$]+$/i, 'token with allowed $')
      .description('The name of the variable.'),
    output: Joi.string()
      .required()
      .default('$r')
      .regex(/^[a-z0-9_$]+$/i, 'token with allowed $')
      .description('The state variable to output to')
  })
)

export const resetConversationVariable = baseAction(
  async (bp, state, event, { name }) => {
    const stateId = (state && state._stateId) || event.stateId || event.user.id
    const key = getConversationStorageKey(stateId, name)
    await removeStorageKeysStartingWith(bp, key)
  },
  Joi.object().keys({
    ...Annotate('Storage', 'Reset conversation variable', 'Deletes a conversation variable'),
    name: Joi.string()
      .required()
      .regex(/^[a-z0-9_$]+$/i, 'token with allowed $')
      .description('The name of the variable.')
  })
)

export const setGlobalVariable = baseAction(
  async (bp, state, event, { name, value, expiry }) => {
    const key = getGlobalStorageKey(name)
    await setStorageWithExpiry(bp, key, value, expiry)
  },
  Joi.object().keys({
    ...Annotate('Storage', 'Set global variable', 'Stores a variable globally, with optional expiry'),
    name: Joi.string()
      .required()
      .regex(/^[a-z0-9_$]+$/i, 'token with allowed $')
      .description('The name of the variable.'),
    value: Joi.any()
      .optional()
      .description('Set the value of the variable.'),
    expiry: Joi.string()
      .optional()
      .default('never')
      .description('Set the expiry of the data, can be "never" or a short string like "6 hours".')
  })
)

export const getGlobalVariable = baseAction(
  async (bp, state, event, { name, output }) => {
    const key = getGlobalStorageKey(name)
    const result = await getStorageWithExpiry(bp, key)
    return { ...state, [output]: result }
  },
  Joi.object().keys({
    ...Annotate(
      'Storage',
      'Get global variable',
      "Retrieves a global variable, if that data hasn't expired. (out to `$r`)"
    ),
    name: Joi.string()
      .required()
      .regex(/^[a-z0-9_$]+$/i, 'token with allowed $')
      .description('The name of the variable.'),
    output: Joi.string()
      .required()
      .default('$r')
      .regex(/^[a-z0-9_$]+$/i, 'token with allowed $')
      .description('The state variable to output to')
  })
)

export const resetGlobalVariable = baseAction(
  async (bp, state, event, { name }) => {
    const key = getGlobalStorageKey(name)
    await removeStorageKeysStartingWith(bp, key)
  },
  Joi.object().keys({
    ...Annotate('Storage', 'Reset global variable', 'Deletes a global variable'),
    name: Joi.string()
      .required()
      .regex(/^[a-z0-9_$]+$/i, 'token with allowed $')
      .description('The name of the variable.')
  })
)
