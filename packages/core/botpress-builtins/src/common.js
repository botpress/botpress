export const USER_TAG_CONVO_COUNT = 'BUILTIN_CONVO_COUNT'
export const USER_TAG_CONVO_LAST = 'BUILTIN_CONVO_LAST'

export const getConversationStorageKey = (stateId, variable) => `storage/conversation/${stateId}/${variable}`
export const getUserStorageKey = (userId, variable) => `storage/users/${userId}/${variable}`
export const getGlobalStorageKey = variable => `storage/global/${variable}`
