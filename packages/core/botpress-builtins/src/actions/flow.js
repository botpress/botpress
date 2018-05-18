import Promise from 'bluebird'
import Joi from 'joi'
import moment from 'moment'
import ms from 'ms'

import baseAction, { Annotate } from './base'

export const wait = baseAction(
  async (bp, state, event, { time }) => {
    console.log(time, typeof time)
    await Promise.delay(time)
  },
  Joi.object().keys({
    ...Annotate('Flow', 'Wait', 'Waits and do nothing for a given period of time'),
    time: Joi.number()
      .required()
      .default(1000)
      .min(1)
      .max(60000)
      .description('The amount of time to wait in milliseconds.')
  })
)
