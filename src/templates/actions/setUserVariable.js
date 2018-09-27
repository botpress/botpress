console.log(event, bp)

import Joi from 'joi'

const schema = Joi.object().keys({
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

const { error } = Joi.validate({ name, value, expiry }, schema)

if (error) {
  bp.logger.forBot(event.botId).error(error.message)
}

const userId = event.user.id
const key = bp.kvs.getUserStorageKey(userId, name)
await bp.kvs.setStorageWithExpiry(event.botId, key, value, expiry)
