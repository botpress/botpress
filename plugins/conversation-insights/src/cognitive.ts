type ConversationUpdate = {
  title: string
  summary: string
}

export const getUpdate = async (props): Promise<ConversationUpdate> => {
  return { title: 'updatedTitle', summary: 'updatedSummary' }
}
