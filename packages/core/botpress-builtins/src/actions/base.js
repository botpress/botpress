import Joi from 'joi'

export default (handler, schema) => (state, event, options) => {
  if (options == 'bp::describe-action') {
    if (schema) {
      return Joi.describe(schema)
    } else {
      return {}
    }
  }

  if (schema) {
    options = Joi.attempt(options, schema, 'Invalid options provided to action')
  }

  return handler(event.bp, state, event, options || {})
}

export const Annotate = (category = 'None', title = '', description = '') => {
  return {
    __category: Joi.any()
      .optional()
      .strip()
      .description(category),
    __title: Joi.any()
      .optional()
      .strip()
      .description(title),
    __description: Joi.any()
      .optional()
      .strip()
      .description(description)
  }
}
