import { customAlphabet } from 'nanoid'

export const prettyId = (length = 10) => customAlphabet('1234567890abcdef', length)()
