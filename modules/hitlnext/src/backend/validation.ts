import Joi, { ValidationError } from 'joi'

export const CreateCommentSchema = Joi.object({
  handoffId: Joi.number().required(),
  agentId: Joi.string().required(),
  threadId: Joi.string().required(),
  content: Joi.string().required()
})

export const CreateHandoffSchema = Joi.object({
  status: Joi.string()
    .required()
    .valid('pending'),
  userId: Joi.string().required(),
  userThreadId: Joi.string().required(),
  userChannel: Joi.string().required()
})

export const UpdateHandoffSchema = Joi.object({
  tags: Joi.array()
    .items(Joi.string())
    .required()
})

export const AssignHandoffSchema = Joi.object({
  agentId: Joi.string().required(),
  status: Joi.string()
    .required()
    .valid('assigned'),
  agentThreadId: Joi.string().required(),
  assignedAt: Joi.date().required()
})

export const ResolveHandoffSchema = Joi.object({
  status: Joi.string()
    .required()
    .valid('resolved', 'rejected'),
  resolvedAt: Joi.date().required()
})

export const AgentOnlineValidation = Joi.object({
  online: Joi.boolean()
    .valid(true)
    .messages({ 'any.only': 'You must be online to perform this action' })
})

export const validateHandoffStatusRule = (original: string, value: string) => {
  let message: string

  if (['pending', 'assigned'].includes(original) && value === 'rejected') {
    return
  }

  if (original === 'expired') {
    message = `Status "${original}" can't transition to "${value}"`
  } else if (original === 'pending' && value !== 'assigned') {
    message = `Status "${original}" can only transition to "assigned"`
  } else if (original === 'assigned' && value !== 'resolved') {
    message = `Status "${original}" can only transition to "resolved"`
  } else if (original === value) {
    message = `Status "${original}" can't transition to "${value}"`
  } else if (original === 'resolved') {
    message = `Status "${original}" can't transition to "${value}"`
  } else {
    return
  }

  throw new ValidationError(
    'Invalid transition',
    [
      {
        message,
        type: 'transition'
      }
    ],
    {}
  )
}
