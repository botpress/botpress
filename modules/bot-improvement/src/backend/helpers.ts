import assert from 'assert'
import { IO } from 'botpress/sdk'

export const sortStoredEvents = (a: IO.StoredEvent, b: IO.StoredEvent) => {
  if (a.direction === 'incoming' && b.direction === 'outgoing') {
    return -1
  }
  if (a.direction === 'outgoing' && b.direction === 'incoming') {
    return 1
  }

  assert(a.direction === 'outgoing')
  assert(b.direction === 'outgoing')
  if (a.event.createdOn < b.event.createdOn) {
    return -1
  }
  if (a.event.createdOn > b.event.createdOn) {
    return 1
  }
  return 0
}
