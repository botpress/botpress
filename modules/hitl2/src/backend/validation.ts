import Joi from 'joi'
import { ValidationError } from 'joi'

export const CreateCommentSchema = Joi.object({
  escalationId: Joi.number().required(),
  agentId: Joi.string().required(),
  content: Joi.string().required()
})

export const CreateEscalationSchema = Joi.object({
  status: Joi.string()
    .required()
    .valid('pending'),
  userConversationId: Joi.string().required()
})

export const AssignEscalationSchema = Joi.object({
  agentId: Joi.string().required(),
  status: Joi.string()
    .required()
    .valid('assigned'),
  assignedAt: Joi.date().required()
})

export const ResolveEscalationSchema = Joi.object({
  status: Joi.string()
    .required()
    .valid('resolved'),
  resolvedAt: Joi.date().required()
})

export const AgentOnlineSchema = Joi.object({
  online: Joi.boolean().required()
})

export const AgentOnlineValidation = Joi.object({
  online: Joi.boolean()
    .valid(true)
    .messages({ 'any.only': 'You must be online to perform this action' })
})

export const escalationStatusRule = (original: string, value: string) => {
  let message: string

  if (original == 'pending' && value != 'assigned') {
    message = `Status "${original}" can only transition to "assigned"`
  } else if (original == 'assigned' && value != 'resolved') {
    message = `Status "${original}" can only transition to "resolved"`
  } else if (original == value) {
    message = `Status "${original}" can't transition to "${value}"`
  } else if (original == 'resolved') {
    message = `Status "${original}" can't transition to "${value}"`
  } else {
    return
  }

  throw new ValidationError(
    'Invalid transition',
    [
      {
        message: message,
        type: 'transition'
      }
    ],
    {}
  )
}
