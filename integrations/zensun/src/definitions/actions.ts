import {
  createConversationInputSchema,
  createConversationOutputSchema,
} from '../misc/custom-schemas'

import { createConversationUi } from '../misc/custom-uis'

const createConversation = {
  title: 'Create Conversation',
  input: {
    schema: createConversationInputSchema,
    ui: createConversationUi,
  },
  output: {
    schema: createConversationOutputSchema,
  },
}

export const actions = {
  createConversation,
}
