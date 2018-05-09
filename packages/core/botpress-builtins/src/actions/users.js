import Joi from 'joi'

import baseAction, { Annotate } from './base'

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
