import Joi from 'joi'
import moment from 'moment'
import _ from 'lodash'

import baseAction, { Annotate } from './base'
import { USER_TAG_CONVO_COUNT, USER_TAG_CONVO_LAST } from '../common'

export const tagUser = baseAction(
  async (bp, state, event, { tag, value }) => {
    await bp.users.tag(event.user.id, tag, value)
  },
  Joi.object().keys({
    ...Annotate('Users', 'Tag user', 'Tags a user with a specific tag. Useful for segmenting users.'),
    tag: Joi.string()
      .required()
      .min(3)
      .max(25)
      .token()
      .description('The name of the tag. Case insensitive, will always be uppercased.'),
    value: Joi.any()
      .optional()
      .description('Set the value of the tag.')
  })
)

export const untagUser = baseAction(
  async (bp, state, event, { tag }) => {
    await bp.users.untag(event.user.id, tag)
  },
  Joi.object().keys({
    ...Annotate('Users', 'Remove user tag', 'Removes the tag from a user, if set.'),
    tag: Joi.string()
      .required()
      .min(3)
      .max(25)
      .token()
      .description('The name of the tag. Case insensitive, will always be uppercased.')
  })
)

export const getTimeSinceLastConversation = baseAction(
  async (bp, state, event, { unit }) => {
    const result = await bp.users.getTag(event.user.id, USER_TAG_CONVO_LAST, true)
    const tagged_on = (result && result.tagged_on) || new Date()
    const since = moment().diff(moment(tagged_on), unit)

    return {
      ...state,
      $r: since
    }
  },
  Joi.object().keys({
    ...Annotate(
      'Users',
      'Get elasped time since last conversation',
      'Returns the time since last conversation in the unit of your choice. -> (out to `$r`)'
    ),
    unit: Joi.string()
      .optional()
      .valid(['days', 'hours', 'minutes', 'seconds', 'months', 'years'])
      .default('days')
      .description('The unit of time elasped.')
  })
)

export const getTotalNumberOfConversations = baseAction(
  async (bp, state, event, { unit }) => {
    const count = await bp.users.getTag(event.user.id, USER_TAG_CONVO_COUNT)

    return {
      ...state,
      $r: parseInt(count || 0)
    }
  },
  Joi.object().keys({
    ...Annotate(
      'Users',
      'Get total number of conversations',
      'Returns the total number of conversations this user had with the bot -> (out to `$r`)'
    )
  })
)
